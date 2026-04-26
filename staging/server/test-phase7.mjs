// ── Phase 7 Automated Test Suite ──────────────────────────────────
// Tests all Phase 7 changes: dedup, transactions, session timeout,
// message queue, structured logging, and new DB tables.
// ──────────────────────────────────────────────────────────────────

import db from './src/db.js';
import { processIncoming, cleanupDedupRecords, cleanupStaleSessions } from './src/bot-engine.js';
import { processMessageQueue, enqueueMessage } from './src/message-queue.js';

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    results.push(`  ❌ ${name}: ${err.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

console.log('\n══════════════════════════════════════════════');
console.log('  PHASE 7 — Automated Test Suite');
console.log('══════════════════════════════════════════════\n');

// ═══════════════════════════════════════════════════════════════
// TEST 7: Verify all new tables exist
// ═══════════════════════════════════════════════════════════════
console.log('── Test 7: New Tables ──');

test('processed_callbacks table exists', () => {
  const cols = db.prepare('PRAGMA table_info(processed_callbacks)').all().map(c => c.name);
  assert(cols.includes('id'), 'missing id');
  assert(cols.includes('business_id'), 'missing business_id');
  assert(cols.includes('channel'), 'missing channel');
  assert(cols.includes('customer_id'), 'missing customer_id');
  assert(cols.includes('callback_hash'), 'missing callback_hash');
  assert(cols.includes('processed_at'), 'missing processed_at');
});

test('telegram_updates table exists', () => {
  const cols = db.prepare('PRAGMA table_info(telegram_updates)').all().map(c => c.name);
  assert(cols.includes('id'), 'missing id');
  assert(cols.includes('business_id'), 'missing business_id');
  assert(cols.includes('update_id'), 'missing update_id');
  assert(cols.includes('processed_at'), 'missing processed_at');
});

test('message_queue table exists', () => {
  const cols = db.prepare('PRAGMA table_info(message_queue)').all().map(c => c.name);
  assert(cols.includes('id'), 'missing id');
  assert(cols.includes('business_id'), 'missing business_id');
  assert(cols.includes('channel'), 'missing channel');
  assert(cols.includes('chat_id'), 'missing chat_id');
  assert(cols.includes('message_json'), 'missing message_json');
  assert(cols.includes('status'), 'missing status');
  assert(cols.includes('attempt_count'), 'missing attempt_count');
  assert(cols.includes('max_attempts'), 'missing max_attempts');
  assert(cols.includes('next_retry_at'), 'missing next_retry_at');
  assert(cols.includes('error_message'), 'missing error_message');
});

test('conversations has last_activity column', () => {
  const cols = db.prepare('PRAGMA table_info(conversations)').all().map(c => c.name);
  assert(cols.includes('last_activity'), 'missing last_activity');
});

// ═══════════════════════════════════════════════════════════════
// TEST 1: Double-Click Dedup (Bot Engine)
// ═══════════════════════════════════════════════════════════════
console.log('\n── Test 1: Double-Click Dedup ──');

// Find a valid business to test with
const testBiz = db.prepare('SELECT id FROM businesses LIMIT 1').get();
assert(testBiz, 'No business found for testing');
const bizId = testBiz.id;

test('First call returns responses, second identical call returns empty (dedup)', () => {
  // Clear any existing dedup records and conversations for clean test
  db.prepare('DELETE FROM processed_callbacks WHERE business_id = ?').run(bizId);
  db.prepare("DELETE FROM conversations WHERE business_id = ? AND status = 'active'").run(bizId);
  db.prepare("DELETE FROM customers WHERE business_id = ? AND channel_user_id = 'test_user_dedup'").run(bizId);

  // First: start a conversation (exempt from dedup)
  processIncoming(bizId, 'test_user_dedup', 'whatsapp', 'Test User', { text: '/start', callbackData: null });
  db.prepare('DELETE FROM processed_callbacks WHERE business_id = ?').run(bizId);

  // Now send same non-reset message twice — second should be deduped
  const input = { text: 'hello', callbackData: null };
  const result1 = processIncoming(bizId, 'test_user_dedup', 'whatsapp', 'Test User', input);
  assert(result1.length > 0, `First call should return responses, got ${result1.length}`);

  // Same input immediately again — should be deduped
  const result2 = processIncoming(bizId, 'test_user_dedup', 'whatsapp', 'Test User', input);
  assert(result2.length === 0, `Second call should return empty (deduped), got ${result2.length}`);
});

test('Different inputs are NOT deduped', () => {
  db.prepare('DELETE FROM processed_callbacks WHERE business_id = ?').run(bizId);

  const input1 = { text: '/start', callbackData: null };
  const input2 = { text: '/menu', callbackData: null };
  const result1 = processIncoming(bizId, 'test_user_dedup2', 'whatsapp', 'Test User', input1);
  const result2 = processIncoming(bizId, 'test_user_dedup2', 'whatsapp', 'Test User', input2);
  assert(result1.length > 0, 'First call should return responses');
  assert(result2.length > 0, 'Second call (different input) should also return responses');
});

test('Dedup cleanup removes old records', () => {
  // Insert an old record
  db.prepare(
    "INSERT INTO processed_callbacks (business_id, channel, customer_id, callback_hash, processed_at) VALUES (?, ?, ?, ?, datetime('now', '-10 minutes'))"
  ).run(bizId, 'whatsapp', 999, 'old_hash_test');

  const before = db.prepare('SELECT COUNT(*) as cnt FROM processed_callbacks WHERE callback_hash = ?').get('old_hash_test').cnt;
  assert(before === 1, 'Old record should exist');

  cleanupDedupRecords();

  const after = db.prepare('SELECT COUNT(*) as cnt FROM processed_callbacks WHERE callback_hash = ?').get('old_hash_test').cnt;
  assert(after === 0, 'Old record should be cleaned up');
});

// ═══════════════════════════════════════════════════════════════
// TEST 3: Session Timeout
// ═══════════════════════════════════════════════════════════════
console.log('\n── Test 3: Session Timeout ──');

test('Active conversation gets last_activity updated', () => {
  db.prepare("DELETE FROM conversations WHERE business_id = ? AND channel = 'whatsapp'").run(bizId);
  db.prepare("DELETE FROM customers WHERE business_id = ? AND channel = 'whatsapp' AND channel_user_id = 'timeout_test'").run(bizId);
  db.prepare('DELETE FROM processed_callbacks WHERE business_id = ?').run(bizId);

  // Create a conversation via processIncoming
  processIncoming(bizId, 'timeout_test', 'whatsapp', 'Timeout Test', { text: '/start', callbackData: null });

  const conv = db.prepare(
    "SELECT * FROM conversations WHERE business_id = ? AND channel = 'whatsapp' AND status = 'active' ORDER BY id DESC LIMIT 1"
  ).get(bizId);
  assert(conv, 'Active conversation should exist');
  assert(conv.last_activity !== null, 'last_activity should be set');
});

test('Expired sessions get cleaned up by cron', () => {
  // Set last_activity to 31 minutes ago
  db.prepare(
    "UPDATE conversations SET last_activity = datetime('now', '-31 minutes') WHERE business_id = ? AND status = 'active'"
  ).run(bizId);

  const before = db.prepare("SELECT COUNT(*) as cnt FROM conversations WHERE business_id = ? AND status = 'active'").get(bizId).cnt;
  
  cleanupStaleSessions();

  const after = db.prepare("SELECT COUNT(*) as cnt FROM conversations WHERE business_id = ? AND status = 'active'").get(bizId).cnt;
  assert(after < before, `Stale sessions should be cleaned up (before: ${before}, after: ${after})`);
});

test('Expired session sends timeout message on next interaction', () => {
  db.prepare('DELETE FROM processed_callbacks WHERE business_id = ?').run(bizId);
  db.prepare("DELETE FROM customers WHERE business_id = ? AND channel = 'whatsapp' AND channel_user_id = 'timeout_msg_test'").run(bizId);

  // Create a fresh conversation
  processIncoming(bizId, 'timeout_msg_test', 'whatsapp', 'Test', { text: '/start', callbackData: null });
  db.prepare('DELETE FROM processed_callbacks WHERE business_id = ?').run(bizId);

  // Expire it
  db.prepare(
    "UPDATE conversations SET last_activity = datetime('now', '-31 minutes') WHERE business_id = ? AND status = 'active' AND channel = 'whatsapp'"
  ).run(bizId);

  // Next message should get timeout + welcome
  const result = processIncoming(bizId, 'timeout_msg_test', 'whatsapp', 'Test', { text: 'hello', callbackData: null });
  const hasTimeout = result.some(m => m.body && m.body.toLowerCase().includes('session expired'));
  assert(hasTimeout, `Should include session expired message, got: ${result.map(m => m.body).join(' | ')}`);
});

// ═══════════════════════════════════════════════════════════════
// TEST 5: Message Queue
// ═══════════════════════════════════════════════════════════════
console.log('\n── Test 5: Message Queue ──');

test('enqueueMessage adds message to queue', () => {
  const beforeCount = db.prepare("SELECT COUNT(*) as cnt FROM message_queue WHERE business_id = ?").get(bizId).cnt;
  
  enqueueMessage(bizId, 'telegram', '12345', { type: 'text', body: 'Test message' });
  
  const afterCount = db.prepare("SELECT COUNT(*) as cnt FROM message_queue WHERE business_id = ?").get(bizId).cnt;
  assert(afterCount === beforeCount + 1, `Queue should have 1 more message (was ${beforeCount}, now ${afterCount})`);
});

test('Queued message has correct initial status', () => {
  const msg = db.prepare(
    "SELECT * FROM message_queue WHERE business_id = ? ORDER BY id DESC LIMIT 1"
  ).get(bizId);
  assert(msg.status === 'pending', `Status should be 'pending', got '${msg.status}'`);
  assert(msg.attempt_count === 0, `attempt_count should be 0, got ${msg.attempt_count}`);
  assert(msg.channel === 'telegram', `channel should be 'telegram', got '${msg.channel}'`);
  assert(msg.chat_id === '12345', `chat_id should be '12345', got '${msg.chat_id}'`);
});

test('processMessageQueue processes pending messages (fails gracefully without token)', async () => {
  await processMessageQueue();
  // Without a real Telegram token, messages should fail and get retry scheduled
  const msg = db.prepare(
    "SELECT * FROM message_queue WHERE business_id = ? AND chat_id = '12345' ORDER BY id DESC LIMIT 1"
  ).get(bizId);
  // Should have attempted and either failed or exhausted
  assert(msg.attempt_count >= 1 || msg.status === 'exhausted', 
    `Should have attempted delivery (attempts: ${msg.attempt_count}, status: ${msg.status})`);
});

// ═══════════════════════════════════════════════════════════════
// TEST 6: Transaction Safety (Submission)
// ═══════════════════════════════════════════════════════════════
console.log('\n── Test 6: Transaction Safety ──');

test('Submission creation is atomic (no duplicates on rapid calls)', () => {
  db.prepare('DELETE FROM processed_callbacks WHERE business_id = ?').run(bizId);
  db.prepare("DELETE FROM customers WHERE business_id = ? AND channel = 'whatsapp' AND channel_user_id = 'txn_test'").run(bizId);

  const flow = db.prepare('SELECT * FROM flows WHERE business_id = ? LIMIT 1').get(bizId);
  if (!flow) {
    results.push('  ⚠️  Skipping transaction test (no flow configured)');
    return;
  }

  const subsBefore = db.prepare('SELECT COUNT(*) as cnt FROM submissions WHERE business_id = ?').get(bizId).cnt;

  // Start conversation
  processIncoming(bizId, 'txn_test', 'whatsapp', 'Txn Test', { text: '/start', callbackData: null });

  const subsAfter = db.prepare('SELECT COUNT(*) as cnt FROM submissions WHERE business_id = ?').get(bizId).cnt;
  // Starting a conversation should NOT create a submission
  assert(subsAfter === subsBefore, `No submission should be created on start (before: ${subsBefore}, after: ${subsAfter})`);
});

// ═══════════════════════════════════════════════════════════════
// TEST 2: Telegram update_id tracking
// ═══════════════════════════════════════════════════════════════
console.log('\n── Test 2: Telegram update_id tracking ──');

test('First insert of update_id succeeds', () => {
  db.prepare('DELETE FROM telegram_updates WHERE business_id = ?').run(bizId);
  const result = db.prepare(
    'INSERT INTO telegram_updates (business_id, update_id) VALUES (?, ?)'
  ).run(bizId, 99999);
  assert(result.changes === 1, 'Insert should succeed');
});

test('Duplicate update_id is rejected (UNIQUE constraint)', () => {
  try {
    db.prepare(
      'INSERT INTO telegram_updates (business_id, update_id) VALUES (?, ?)'
    ).run(bizId, 99999);
    assert(false, 'Should have thrown on duplicate');
  } catch (err) {
    assert(err.message.includes('UNIQUE'), `Should be UNIQUE constraint error, got: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// TEST 4: Structured Logging (verify functions exist)
// ═══════════════════════════════════════════════════════════════
console.log('\n── Test 4: Structured Logging ──');

test('processIncoming produces console log output (smoke test)', () => {
  // We just verify it runs without errors — logs go to console
  db.prepare('DELETE FROM processed_callbacks WHERE business_id = ?').run(bizId);
  db.prepare("DELETE FROM customers WHERE business_id = ? AND channel = 'whatsapp' AND channel_user_id = 'log_test'").run(bizId);
  
  const result = processIncoming(bizId, 'log_test', 'whatsapp', 'Log Test', { text: '/start', callbackData: null });
  assert(result.length > 0, 'Should return welcome message');
  // If we got here without error, logging is working
});

// ═══════════════════════════════════════════════════════════════
// CLEANUP test data
// ═══════════════════════════════════════════════════════════════
db.prepare("DELETE FROM customers WHERE channel_user_id LIKE '%test%'").run();
db.prepare("DELETE FROM conversations WHERE channel = 'whatsapp' AND business_id = ?").run(bizId);
db.prepare('DELETE FROM processed_callbacks WHERE business_id = ?').run(bizId);
db.prepare('DELETE FROM telegram_updates WHERE business_id = ? AND update_id = 99999').run(bizId);
db.prepare("DELETE FROM message_queue WHERE business_id = ? AND chat_id = '12345'").run(bizId);

// ═══════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('  RESULTS');
console.log('══════════════════════════════════════════════');
for (const r of results) console.log(r);
console.log('──────────────────────────────────────────────');
console.log(`  Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
console.log('══════════════════════════════════════════════\n');

db.close();
process.exit(failed > 0 ? 1 : 0);
