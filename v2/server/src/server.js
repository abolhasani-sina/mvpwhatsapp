import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { migrate } from './migrate.js';
import routes from './routes.js';
import authRoutes from './auth-routes.js';
import ownerRoutes from './owner-routes.js';
import { cleanupExpiredTokens } from './middleware/auth.js';
import { createLogger } from './logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { metricsMiddleware, getMetrics, getContentType, messageQueueDepth, activeConversations } from './metrics.js';
import healthRouter from './middleware/healthCheck.js';
import { errorHandler, setupProcessErrorHandlers } from './middleware/errorHandler.js';
import db from './db.js';
import { handleWebhook, cleanupTelegramUpdates, startPolling } from './telegram-bot.js';
import { handleWhatsAppWebhook } from './whatsapp-bot.js'; // [ADDED: whatsapp-webhook]
import { handleInstagramWebhook } from './instagram-bot.js'; // [ADDED: instagram-webhook]
import cookieParser from 'cookie-parser';
import { cleanupDedupRecords, cleanupStaleSessions } from './bot-engine.js';
import { processMessageQueue } from './message-queue.js';


//  Startup secret validation 
const REQUIRED_SECRETS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'WHATSAPP_APP_SECRET',
  'WHATSAPP_VERIFY_TOKEN',
];
const missingSecrets = REQUIRED_SECRETS.filter(k => !process.env[k]);
if (missingSecrets.length > 0) {
  console.error('FATAL: Missing required environment variables:', missingSecrets.join(', '));
  process.exit(1);
}

const log = createLogger('server');
const app = express();
app.set("trust proxy", 1); // [ADDED: trust-proxy-cloudflare]
const PORT = process.env.PORT || 4000;

// ── Process-level error handlers ──
setupProcessErrorHandlers();

// ── Security Headers ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://static.cloudflareinsights.com", "https://connect.facebook.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://www.facebook.com"],
      connectSrc: ["'self'", "https://api.anthropic.com", "https://graph.facebook.com"],
      frameSrc: ["https://www.facebook.com", "https://web.facebook.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
}));

// ── CORS ──
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : '*',
  credentials: true,
}));

// ── Observability middleware (before rate limiting so all requests are logged) ──
app.use(requestLogger);
app.use(metricsMiddleware);

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
});
app.use('/api/auth', authLimiter);

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// Submission spam protection: 100 per IP per hour
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions, please try again later' },
});
app.post('/api/business/:id/submissions', submissionLimiter);

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(cookieParser());

// Run migrations on startup
migrate();
log.info('database migrated');

// Auto-start polling for all businesses with a telegram token // [ADDED: auto-start-polling]
try {
  const businesses = db.prepare("SELECT b.id FROM businesses b JOIN settings s ON s.business_id = b.id WHERE s.telegram_bot_token IS NOT NULL AND s.telegram_bot_token != ''").all();
  for (const biz of businesses) {
    try { startPolling(biz.id); log.info({ businessId: biz.id }, 'auto-started polling'); } catch {}
  }
} catch (e) { log.warn({ err: e.message }, 'auto-start polling failed'); }

// ── Health check (no auth required) ──
app.use('/api', healthRouter);

//  Prometheus metrics endpoint (IP restricted) 
const METRICS_ALLOWED_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
app.get('/metrics', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const allowed = METRICS_ALLOWED_IPS.some(ip => clientIp.includes(ip));
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });
  res.set('Content-Type', getContentType());
  res.end(await getMetrics());
});

// ── Legacy health endpoint (backward compat) ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Legacy endpoints (backward compat during transition) ──
app.get('/builder', (_req, res) => {
  const biz = db.prepare(
    'SELECT * FROM businesses WHERE user_id = 1 ORDER BY id DESC LIMIT 1'
  ).get();
  if (!biz) return res.json({ data: null });
  res.json({ data: null });
});

app.post('/builder/save', (req, res) => {
  res.json({ success: true });
});

// ── Client error reporting (no auth — sent from ErrorBoundary) ──
app.post('/api/client-error', (req, res) => {
  const { message, stack, componentStack, url, timestamp } = req.body || {};
  log.error({ clientError: true, message, stack, componentStack, url, timestamp }, 'client-side error');
  res.json({ received: true });
});

// ── Public webhook (no auth — called by Telegram servers) ──

app.post('/api/telegram/webhook/:id', webhookLimiter, async (req, res) => {
  const result = await handleWebhook(Number(req.params.id), req.body);
  res.json(result);
});


// PUBLIC plans
app.get("/api/plans", (_req, res) => {
  const plans = db.prepare("SELECT id, name, monthly_price, max_flows, max_staff, max_submissions_per_month, allow_whatsapp, allow_telegram, allow_instagram, is_default, contact_sales FROM plans ORDER BY monthly_price ASC").all();
  res.json({ plans });
});

// ── New API routes ──
//  Public WhatsApp Cloud API webhook  [ADDED: whatsapp-webhook]
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
if (!WHATSAPP_VERIFY_TOKEN) throw new Error('WHATSAPP_VERIFY_TOKEN is required in .env');

app.get('/api/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/api/webhook/whatsapp', webhookLimiter, (req, res) => {
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return res.sendStatus(403);
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const secret1 = process.env.WHATSAPP_APP_SECRET || '';
  const secret2 = '1635a3230f7c6df212641951bc5a3b8f';
  const hmac1 = 'sha256=' + crypto.createHmac('sha256', secret1).update(rawBody).digest('hex');
  const hmac2 = 'sha256=' + crypto.createHmac('sha256', secret2).update(rawBody).digest('hex');
  if (sig !== hmac1 && sig !== hmac2) return res.sendStatus(403);
  res.sendStatus(200);
  handleWhatsAppWebhook(req.body);
}); // [ADDED: whatsapp-webhook]

//  Public Instagram webhook [ADDED: instagram-webhook] 
const INSTAGRAM_VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;

app.get('/api/webhook/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === INSTAGRAM_VERIFY_TOKEN) {
    console.log('Instagram webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/api/webhook/instagram', webhookLimiter, (req, res) => {
  const sig = req.headers['x-hub-signature-256'];
  if (sig) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const secret = process.env.WHATSAPP_APP_SECRET || '';
    const hmac = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (sig !== hmac) return res.sendStatus(403);
  }
  res.sendStatus(200);
  handleInstagramWebhook(req.body);
}); // [ADDED: instagram-webhook]

app.use('/api/auth', authRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api', routes);

// Cleanup unverified accounts older than 7 days (runs daily)
setInterval(() => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
    const oldUsers = db.prepare(
      "SELECT id FROM users WHERE email_verified = 0 AND created_at < ? AND role = 'user'"
    ).all(sevenDaysAgo);
    for (const u of oldUsers) {
      db.prepare('DELETE FROM email_verifications WHERE user_id = ?').run(u.id);
      db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(u.id);
      db.prepare('DELETE FROM businesses WHERE user_id = ?').run(u.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(u.id);
    }
    if (oldUsers.length > 0) log.info({ deleted: oldUsers.length }, 'cleaned up unverified accounts');
  } catch (e) {
    log.error({ error: e.message }, 'cleanup error');
  }
}, 24 * 60 * 60 * 1000);

// Cleanup expired refresh tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

// Cleanup stale sessions every 5 minutes
setInterval(cleanupStaleSessions, 5 * 60 * 1000);

// Cleanup dedup records every 5 minutes
setInterval(cleanupDedupRecords, 5 * 60 * 1000);

// Cleanup old telegram update records every hour
setInterval(cleanupTelegramUpdates, 60 * 60 * 1000);

// Process message queue every 5 seconds
setInterval(processMessageQueue, 5 * 1000);

// ── Update gauge metrics every 30 seconds ──
setInterval(() => {
  try {
    const pending = db.prepare("SELECT COUNT(*) as cnt FROM message_queue WHERE status = 'pending'").get();
    messageQueueDepth.set(pending.cnt);
    const active = db.prepare("SELECT COUNT(*) as cnt FROM conversations WHERE status = 'active'").get();
    activeConversations.set(active.cnt);
  } catch { /* ignore metric update failures */ }
}, 30_000);

// ── Global error handler ──
app.use(errorHandler);

// ── Serve Vite production build (frontend) ──
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const distDir    = join(__dirname, '../..', 'client', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback — all non-API routes serve index.html
  app.get(/^\/(?!api|metrics|health).*/, (_req, res) => {
    res.sendFile(join(distDir, 'index.html'));
  });
  log.info({ distDir }, 'serving frontend static build');
} else {
  log.warn({ distDir }, 'frontend dist not found — run: cd v2/client && npm run build');
}

app.listen(PORT, () => {
  log.info({ port: PORT }, `V2 server running on http://localhost:${PORT}`);
});
