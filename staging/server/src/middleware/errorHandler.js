// ── Global Error Handler ──────────────────────────────────────────
// Catches all unhandled errors, logs full context, and returns a
// safe generic message with a unique errorId for support reference.
// ──────────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import { createLogger } from '../logger.js';

const log = createLogger('error');

export function errorHandler(err, req, res, _next) {
  const errorId = randomUUID();

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    log.warn({ errorId, path: req.path, method: req.method }, 'invalid JSON in request body');
    return res.status(400).json({ error: 'Invalid JSON in request body', errorId });
  }

  // Validation errors from express-validator (already handled by validate(), but just in case)
  if (err.status === 422) {
    return res.status(422).json({ error: err.message || 'Validation failed', errorId });
  }

  // Log full error with context
  log.error({
    errorId,
    err,
    path: req.originalUrl || req.url,
    method: req.method,
    userId: req.userId || null,
    ip: req.ip,
  }, 'unhandled error');

  // Never expose internal errors to the client
  res.status(err.status || 500).json({
    error: 'Internal server error',
    errorId,
    timestamp: new Date().toISOString(),
  });
}

// ── Catch unhandled promise rejections and uncaught exceptions ──
export function setupProcessErrorHandlers() {
  process.on('unhandledRejection', (reason) => {
    log.fatal({ err: reason }, 'unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    log.fatal({ err }, 'uncaught exception — process will exit');
    // Give logger time to flush, then exit
    setTimeout(() => process.exit(1), 1000);
  });
}
