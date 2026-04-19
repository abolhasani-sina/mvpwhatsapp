import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { migrate } from './migrate.js';
import routes from './routes.js';
import authRoutes from './auth-routes.js';
import { cleanupExpiredTokens } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security Headers ──
app.use(helmet());

// ── CORS ──
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : '*',
  credentials: true,
}));

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
console.log('Database migrated.');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Legacy endpoints (backward compat during transition) ──
import db from './db.js';

app.get('/builder', (_req, res) => {
  // Try to load the latest business for mock user 1
  const biz = db.prepare(
    'SELECT * FROM businesses WHERE user_id = 1 ORDER BY id DESC LIMIT 1'
  ).get();
  if (!biz) return res.json({ data: null });

  // Load full builder data via the same logic as /api/business/:id/builder
  // For backward compat just return null and let frontend use new API
  res.json({ data: null });
});

app.post('/builder/save', (req, res) => {
  // Legacy endpoint — no-op, frontend will switch to new API
  res.json({ success: true });
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

// ── Global error handler (hide stack traces from clients) ──
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`V2 server running on http://localhost:${PORT}`);
});
