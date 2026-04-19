import express from 'express';
import cors from 'cors';
import { migrate } from './migrate.js';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
}));
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

// ── New API routes ──
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`V2 server running on http://localhost:${PORT}`);
});
