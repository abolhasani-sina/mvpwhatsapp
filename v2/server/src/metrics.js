// ── Prometheus Metrics ────────────────────────────────────────────
// Exposes HTTP, Telegram, submission, and queue metrics in
// Prometheus format at /metrics endpoint.
// ──────────────────────────────────────────────────────────────────

import client from 'prom-client';

// ── Collect default Node.js metrics (event loop, heap, GC, etc.) ──
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ═════════════════════════════════════════════════════════════════
// Custom metrics
// ═════════════════════════════════════════════════════════════════

// HTTP request duration (histogram)
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// HTTP request count (counter)
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

// HTTP error count (counter)
export const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors (4xx and 5xx)',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

// Telegram polling messages received (counter)
export const telegramMessagesReceived = new client.Counter({
  name: 'telegram_polling_messages_received_total',
  help: 'Total Telegram messages received via polling',
  registers: [register],
});

// Telegram polling errors (counter)
export const telegramPollingErrors = new client.Counter({
  name: 'telegram_polling_errors_total',
  help: 'Total Telegram polling errors',
  registers: [register],
});

// Submissions created (counter)
export const submissionsCreated = new client.Counter({
  name: 'submissions_created_total',
  help: 'Total submissions created',
  registers: [register],
});

// Submissions failed (counter)
export const submissionsFailed = new client.Counter({
  name: 'submissions_failed_total',
  help: 'Total submissions that failed',
  registers: [register],
});

// Message queue depth (gauge)
export const messageQueueDepth = new client.Gauge({
  name: 'message_queue_depth',
  help: 'Current number of pending messages in queue',
  registers: [register],
});

// Active conversations (gauge)
export const activeConversations = new client.Gauge({
  name: 'active_conversations',
  help: 'Current number of active conversations',
  registers: [register],
});

// Bot engine processing duration (histogram)
export const botProcessingDuration = new client.Histogram({
  name: 'bot_processing_duration_seconds',
  help: 'Duration of bot engine processIncoming calls',
  labelNames: ['channel'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

// ═════════════════════════════════════════════════════════════════
// Metrics middleware — records HTTP metrics per request
// ═════════════════════════════════════════════════════════════════
export function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();

  const originalEnd = res.end;
  res.end = function (...args) {
    // Normalize path to avoid high-cardinality labels
    const path = normalizePath(req.route?.path || req.path);
    const labels = { method: req.method, path, status: res.statusCode };

    end(labels);
    httpRequestsTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpErrorsTotal.inc(labels);
    }

    originalEnd.apply(res, args);
  };

  next();
}

// ── Normalize paths to prevent label explosion ──
function normalizePath(path) {
  return path
    .replace(/\/\d+/g, '/:id')       // /business/5 → /business/:id
    .replace(/\/[a-f0-9-]{36}/g, '/:uuid'); // UUIDs
}

// ── Get metrics output for /metrics endpoint ──
export async function getMetrics() {
  return register.metrics();
}

export function getContentType() {
  return register.contentType;
}
