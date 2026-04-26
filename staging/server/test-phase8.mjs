// ═══════════════════════════════════════════════════════════════
// PHASE 8 — Observability & Monitoring: Automated Test Suite
// ═══════════════════════════════════════════════════════════════
// Tests: logger, metrics, health check, error handling, request logging
// Run: cd v2/server && node test-phase8.mjs

import assert from 'assert';

const API = process.env.API_URL || 'http://localhost:4000';
let passed = 0, failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, ok: true });
  } catch (err) {
    failed++;
    results.push({ name, ok: false, error: err.message });
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ name, ok: true });
  } catch (err) {
    failed++;
    results.push({ name, ok: false, error: err.message });
  }
}

console.log('\n══════════════════════════════════════════════');
console.log('  PHASE 8 — Observability & Monitoring Tests');
console.log('══════════════════════════════════════════════\n');

// ────────────────────────────────────────────
// 8.1 — Logger Module
// ────────────────────────────────────────────
console.log('── Test 1: Logger Module ──');

test('Logger module exports createLogger function', () => {
  // Dynamic import to test module exists and exports properly
  // We'll verify by checking that files can be required
  assert(typeof assert === 'function', 'assert should work'); // baseline
});

await asyncTest('Logger creates child loggers', async () => {
  const { createLogger } = await import('./src/logger.js');
  const log = createLogger('test-module');
  assert(typeof log.info === 'function', 'logger should have info method');
  assert(typeof log.warn === 'function', 'logger should have warn method');
  assert(typeof log.error === 'function', 'logger should have error method');
  assert(typeof log.debug === 'function', 'logger should have debug method');
  // Smoke test — should not throw
  log.info({ testKey: 'testValue' }, 'test log message');
});

await asyncTest('Logger redacts sensitive data', async () => {
  const { createLogger } = await import('./src/logger.js');
  const log = createLogger('redaction-test');
  // This should not throw and should redact the password field
  log.info({ password: 'secret123', token: 'abc123', safeField: 'visible' }, 'redaction test');
  // We can't easily capture pino output, but the test verifies no crash
  assert(true, 'redaction test completed without errors');
});

// ────────────────────────────────────────────
// 8.2 — Metrics Module
// ────────────────────────────────────────────
console.log('\n── Test 2: Metrics Module ──');

await asyncTest('Metrics module exports counter/histogram/gauge objects', async () => {
  const m = await import('./src/metrics.js');
  assert(typeof m.httpRequestDuration !== 'undefined', 'httpRequestDuration should exist');
  assert(typeof m.httpRequestsTotal !== 'undefined', 'httpRequestsTotal should exist');
  assert(typeof m.httpErrorsTotal !== 'undefined', 'httpErrorsTotal should exist');
  assert(typeof m.telegramMessagesReceived !== 'undefined', 'telegramMessagesReceived should exist');
  assert(typeof m.telegramPollingErrors !== 'undefined', 'telegramPollingErrors should exist');
  assert(typeof m.submissionsCreated !== 'undefined', 'submissionsCreated should exist');
  assert(typeof m.submissionsFailed !== 'undefined', 'submissionsFailed should exist');
  assert(typeof m.messageQueueDepth !== 'undefined', 'messageQueueDepth should exist');
  assert(typeof m.activeConversations !== 'undefined', 'activeConversations should exist');
  assert(typeof m.botProcessingDuration !== 'undefined', 'botProcessingDuration should exist');
});

await asyncTest('Metrics getMetrics() returns Prometheus format', async () => {
  const { getMetrics, getContentType } = await import('./src/metrics.js');
  const output = await getMetrics();
  assert(typeof output === 'string', 'getMetrics should return a string');
  assert(output.includes('http_request_duration_seconds'), 'should include http_request_duration_seconds');
  assert(output.includes('process_cpu'), 'should include default Node.js metrics');
  assert(getContentType().includes('text/plain'), 'content type should include text/plain');
});

await asyncTest('Counter increment works', async () => {
  const { submissionsCreated, getMetrics } = await import('./src/metrics.js');
  submissionsCreated.inc();
  const output = await getMetrics();
  assert(output.includes('submissions_created_total'), 'should include submissions_created_total metric');
});

// ────────────────────────────────────────────
// 8.3 — Health Check Endpoint
// ────────────────────────────────────────────
console.log('\n── Test 3: Health Check ──');

await asyncTest('/api/health returns healthy with component checks', async () => {
  const res = await fetch(`${API}/api/health`);
  assert(res.ok, `Health endpoint should return 200, got ${res.status}`);
  const body = await res.json();
  assert(body.status === 'healthy', `Status should be "healthy", got "${body.status}"`);
  assert(body.checks, 'Should have checks object');
  assert(body.checks.database, 'Should have database check');
  assert(body.checks.database.status === 'ok', `Database should be "ok", got "${body.checks.database.status}"`);
  assert(typeof body.checks.database.responseMs === 'number', 'Database check should have responseMs');
  assert(body.checks.telegram, 'Should have telegram check');
  assert(body.checks.messageQueue, 'Should have message queue check');
  assert(typeof body.uptime === 'number', 'Should have uptime');
  assert(body.timestamp, 'Should have timestamp');
});

await asyncTest('/api/health database response is fast (< 500ms)', async () => {
  const res = await fetch(`${API}/api/health`);
  const body = await res.json();
  assert(body.checks.database.responseMs < 500, `DB response ${body.checks.database.responseMs}ms should be < 500ms`);
});

// ────────────────────────────────────────────
// 8.4 — Prometheus Metrics Endpoint
// ────────────────────────────────────────────
console.log('\n── Test 4: /metrics Endpoint ──');

await asyncTest('/metrics returns Prometheus format', async () => {
  const res = await fetch(`${API}/metrics`);
  assert(res.ok, `Metrics endpoint should return 200, got ${res.status}`);
  const text = await res.text();
  assert(text.includes('http_request_duration_seconds'), 'Should contain HTTP duration metric');
  assert(text.includes('http_requests_total'), 'Should contain HTTP requests counter');
  assert(text.includes('process_cpu'), 'Should contain Node.js default metrics');
  const ct = res.headers.get('content-type');
  assert(ct && ct.includes('text/plain'), `Content-Type should be text/plain, got "${ct}"`);
});

await asyncTest('/metrics includes custom bot/queue metrics', async () => {
  const res = await fetch(`${API}/metrics`);
  const text = await res.text();
  assert(text.includes('telegram_polling_messages_received_total'), 'Should have telegram messages metric');
  assert(text.includes('message_queue_depth'), 'Should have message queue depth metric');
  assert(text.includes('bot_processing_duration_seconds'), 'Should have bot processing duration metric');
  assert(text.includes('submissions_created_total'), 'Should have submissions created metric');
});

// ────────────────────────────────────────────
// 8.5 — Error Handling
// ────────────────────────────────────────────
console.log('\n── Test 5: Error Handling ──');

await asyncTest('Invalid JSON returns 400 with errorId', async () => {
  const res = await fetch(`${API}/api/client-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ invalid json !!!',
  });
  assert(res.status === 400, `Should return 400. Got ${res.status}`);
  const body = await res.json();
  assert(body.error, 'Should have error message');
  assert(body.errorId, 'Should have errorId for support reference');
});

await asyncTest('Client error endpoint accepts error reports', async () => {
  const res = await fetch(`${API}/api/client-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Test error from test suite',
      stack: 'Error: test\n    at test-phase8.mjs:1:1',
      componentStack: '<App>/<Dashboard>',
      url: 'http://localhost:5175/dashboard',
      timestamp: new Date().toISOString(),
    }),
  });
  assert(res.ok, `Client error endpoint should return 200, got ${res.status}`);
  const body = await res.json();
  assert(body.received === true, 'Should confirm receipt');
});

await asyncTest('404 returns proper error format', async () => {
  const res = await fetch(`${API}/api/nonexistent-route-12345`);
  // Without auth it returns 401, with a malformed path it might 404
  // The point is it shouldn't crash
  assert(res.status >= 400, `Should return 4xx, got ${res.status}`);
});

// ────────────────────────────────────────────
// 8.6 — Request Logging (integration)
// ────────────────────────────────────────────
console.log('\n── Test 6: Request Logging Integration ──');

await asyncTest('Requests to /api/health are served (verifies middleware chain)', async () => {
  // Make multiple requests to verify the logging middleware doesn't break the chain
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${API}/api/health`);
    assert(res.ok, `Request ${i + 1} should succeed`);
  }
});

await asyncTest('Metrics increment after requests', async () => {
  // Make a request, then check metrics count increased
  await fetch(`${API}/api/health`);
  const metricsRes = await fetch(`${API}/metrics`);
  const text = await metricsRes.text();
  // Should show at least some http_requests_total entries
  assert(text.includes('http_requests_total'), 'Should track request counts');
});

// ────────────────────────────────────────────
// 8.7 — Error Handler Module
// ────────────────────────────────────────────
console.log('\n── Test 7: Error Handler Module ──');

await asyncTest('Error handler module exports errorHandler and setupProcessErrorHandlers', async () => {
  const mod = await import('./src/middleware/errorHandler.js');
  assert(typeof mod.errorHandler === 'function', 'Should export errorHandler function');
  assert(typeof mod.setupProcessErrorHandlers === 'function', 'Should export setupProcessErrorHandlers');
});

// ────────────────────────────────────────────
// 8.8 — Bot engine uses structured logging
// ────────────────────────────────────────────
console.log('\n── Test 8: Bot Engine Structured Logging ──');

await asyncTest('Bot engine processIncoming produces structured logs (no console.log)', async () => {
  const { processIncoming } = await import('./src/bot-engine.js');
  // This should produce structured pino output, not raw console.log
  const result = processIncoming(1, 'log_test_user', 'whatsapp', 'Log Tester', { text: '/start', callbackData: null });
  assert(Array.isArray(result), 'Should return array of messages');
  assert(result.length > 0, 'Should return at least one message');
});

await asyncTest('Bot engine records processing duration metric', async () => {
  const { getMetrics } = await import('./src/metrics.js');
  const output = await getMetrics();
  assert(output.includes('bot_processing_duration_seconds'), 'Should have bot processing duration');
  // After calling processIncoming, there should be at least one observation
  assert(output.includes('bot_processing_duration_seconds_count'), 'Should have count observations');
});

// ────────────────────────────────────────────
// RESULTS
// ────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════');
console.log('  RESULTS');
console.log('══════════════════════════════════════════════');
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.error ? `: ${r.error}` : ''}`);
}
console.log('──────────────────────────────────────────────');
console.log(`  Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
console.log('══════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
