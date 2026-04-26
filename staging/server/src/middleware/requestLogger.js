// ── Request Logging Middleware ─────────────────────────────────────
// Logs every API request with method, path, status, duration, and
// user context. Uses pino for structured JSON output.
// ──────────────────────────────────────────────────────────────────

import { createLogger } from '../logger.js';

const log = createLogger('http');

export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  // Capture original end to measure timing
  const originalEnd = res.end;
  res.end = function (...args) {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = Math.round(durationNs / 1e6);

    const logData = {
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      userId: req.userId || null,
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      log.error(logData, 'request failed');
    } else if (res.statusCode >= 400) {
      log.warn(logData, 'request error');
    } else {
      log.info(logData, 'request completed');
    }

    originalEnd.apply(res, args);
  };

  next();
}
