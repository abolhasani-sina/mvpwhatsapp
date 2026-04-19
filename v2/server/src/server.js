import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { migrate } from './migrate.js';
import routes from './routes.js';
import authRoutes from './auth-routes.js';
import { cleanupExpiredTokens } from './middleware/auth.js';
import { createLogger } from './logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { metricsMiddleware, getMetrics, getContentType, messageQueueDepth, activeConversations } from './metrics.js';
import healthRouter from './middleware/healthCheck.js';
import { errorHandler, setupProcessErrorHandlers } from './middleware/errorHandler.js';
import db from './db.js';

const log = createLogger('server');
const app = express();
const PORT = process.env.PORT || 4000;

// ── Process-level error handlers ──
setupProcessErrorHandlers();

// ── Security Headers ──
app.use(helmet());

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
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
});
app.use('/api/auth', authLimiter);

// Submission spam protection: 100 per IP per hour
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions, please try again later' },
});
app.post('/api/business/:id/submissions', submissionLimiter);

app.use(express.json({ limit: '10mb' }));

// Run migrations on startup
migrate();
log.info('database migrated');

// ── Health check (no auth required) ──
app.use('/api', healthRouter);

// ── Prometheus metrics endpoint (no auth) ──
app.get('/metrics', async (_req, res) => {
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
import { handleWebhook } from './telegram-bot.js';
import { cleanupTelegramUpdates } from './telegram-bot.js';
import { cleanupDedupRecords, cleanupStaleSessions } from './bot-engine.js';
import { processMessageQueue } from './message-queue.js';
app.post('/api/telegram/webhook/:id', async (req, res) => {
  const result = await handleWebhook(Number(req.params.id), req.body);
  res.json(result);
});

// ── New API routes ──
app.use('/api/auth', authRoutes);
app.use('/api', routes);

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

app.listen(PORT, () => {
  log.info({ port: PORT }, `V2 server running on http://localhost:${PORT}`);
});
