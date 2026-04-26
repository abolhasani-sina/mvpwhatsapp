// ── Health Check Endpoint ─────────────────────────────────────────
// Returns system health with individual component checks:
// database, telegram polling, and message queue.
//
// Statuses: "healthy" (all OK), "degraded" (1 failing), "unhealthy" (2+ failing)
// ──────────────────────────────────────────────────────────────────

import { Router } from 'express';
import db from '../db.js';
import { getActivePollers } from '../telegram-bot.js';
import { createLogger } from '../logger.js';

const log = createLogger('health');
const router = Router();

router.get('/health', (_req, res) => {
  const checks = {};
  let failCount = 0;

  // ── 1. Database check ──
  try {
    const start = Date.now();
    db.prepare('SELECT 1').get();
    const ms = Date.now() - start;
    checks.database = { status: ms < 500 ? 'ok' : 'slow', responseMs: ms };
    if (ms >= 500) failCount++;
  } catch (err) {
    checks.database = { status: 'error', error: err.message };
    failCount++;
  }

  // ── 2. Telegram polling check ──
  try {
    const pollers = getActivePollers();
    if (pollers.length === 0) {
      checks.telegram = { status: 'ok', detail: 'no active pollers' };
    } else {
      checks.telegram = { status: 'ok', activePollers: pollers.length };
    }
  } catch (err) {
    checks.telegram = { status: 'error', error: err.message };
    failCount++;
  }

  // ── 3. Message queue check ──
  try {
    const pending = db.prepare("SELECT COUNT(*) as cnt FROM message_queue WHERE status = 'pending'").get();
    const exhausted = db.prepare("SELECT COUNT(*) as cnt FROM message_queue WHERE status = 'exhausted'").get();
    checks.messageQueue = {
      status: pending.cnt < 1000 ? 'ok' : 'overloaded',
      pending: pending.cnt,
      exhausted: exhausted.cnt,
    };
    if (pending.cnt >= 1000) failCount++;
  } catch (err) {
    checks.messageQueue = { status: 'error', error: err.message };
    failCount++;
  }

  // ── Overall status ──
  let status;
  let httpStatus;
  if (failCount === 0) {
    status = 'healthy';
    httpStatus = 200;
  } else if (failCount === 1) {
    status = 'degraded';
    httpStatus = 200;
  } else {
    status = 'unhealthy';
    httpStatus = 503;
  }

  const result = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    checks,
  };

  if (status !== 'healthy') {
    log.warn(result, 'health check degraded/unhealthy');
  }

  res.status(httpStatus).json(result);
});

export default router;
