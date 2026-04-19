// ── Message Queue Worker ──────────────────────────────────────────
// Reliable message delivery with retry logic for Telegram messages.
// Messages are queued in the DB and processed by a worker that runs
// every 5 seconds. Failed messages get exponential backoff retries.
// ──────────────────────────────────────────────────────────────────

import db from './db.js';
import { decryptField } from './middleware/encryption.js';

const TG_API = 'https://api.telegram.org/bot';

function getBotToken(businessId) {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  const settings = db.prepare(
    'SELECT telegram_bot_token FROM settings WHERE business_id = ?'
  ).get(businessId);
  return settings?.telegram_bot_token ? decryptField(settings.telegram_bot_token) : null;
}

// ═════════════════════════════════════════════════════════════════
// Queue a message for delivery
// ═════════════════════════════════════════════════════════════════
export function enqueueMessage(businessId, channel, chatId, message) {
  db.prepare(
    'INSERT INTO message_queue (business_id, channel, chat_id, message_json) VALUES (?, ?, ?, ?)'
  ).run(businessId, channel, String(chatId), JSON.stringify(message));
}

// ═════════════════════════════════════════════════════════════════
// Process pending messages
// ═════════════════════════════════════════════════════════════════
export async function processMessageQueue() {
  const now = new Date().toISOString();
  const pending = db.prepare(
    "SELECT * FROM message_queue WHERE status = 'pending' AND next_retry_at <= ? ORDER BY created_at ASC LIMIT 50"
  ).all(now);

  if (pending.length === 0) return;

  for (const item of pending) {
    try {
      const message = JSON.parse(item.message_json);
      await sendTelegramMessage(item.business_id, item.chat_id, message);

      // Mark as sent
      db.prepare(
        "UPDATE message_queue SET status = 'sent', processed_at = datetime('now') WHERE id = ?"
      ).run(item.id);
    } catch (err) {
      const attempts = item.attempt_count + 1;
      if (attempts >= item.max_attempts) {
        // Exhausted all retries
        db.prepare(
          "UPDATE message_queue SET status = 'exhausted', attempt_count = ?, error_message = ? WHERE id = ?"
        ).run(attempts, err.message, item.id);
        console.error(`[MsgQueue] Message ${item.id} exhausted after ${attempts} attempts: ${err.message}`);
      } else {
        // Schedule retry with exponential backoff
        const backoffSec = Math.pow(2, attempts);
        const nextRetry = new Date(Date.now() + backoffSec * 1000).toISOString();
        db.prepare(
          "UPDATE message_queue SET attempt_count = ?, next_retry_at = ?, error_message = ? WHERE id = ?"
        ).run(attempts, nextRetry, err.message, item.id);
        console.warn(`[MsgQueue] Message ${item.id} failed (attempt ${attempts}), retry at ${nextRetry}: ${err.message}`);
      }
    }
  }

  // Alert if queue is growing too large
  const pendingCount = db.prepare("SELECT COUNT(*) as cnt FROM message_queue WHERE status = 'pending'").get().cnt;
  if (pendingCount > 100) {
    console.error(`[MsgQueue] WARNING: ${pendingCount} pending messages — Telegram API may be down`);
  }
  const failedCount = db.prepare("SELECT COUNT(*) as cnt FROM message_queue WHERE status = 'exhausted'").get().cnt;
  if (failedCount > 50) {
    console.error(`[MsgQueue] WARNING: ${failedCount} exhausted messages — manual investigation needed`);
  }
}

// ═════════════════════════════════════════════════════════════════
// Send a single Telegram message (throws on failure)
// ═════════════════════════════════════════════════════════════════
async function sendTelegramMessage(businessId, chatId, message) {
  const token = getBotToken(businessId);
  if (!token) throw new Error('No bot token configured');

  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/\*([^*]+)\*/g, '<b>$1</b>').replace(/_([^_]+)_/g, '<i>$1</i>');
  };

  let method, body;

  if (message.type === 'text') {
    method = 'sendMessage';
    body = { chat_id: chatId, text: formatText(message.body), parse_mode: 'HTML' };
  } else if (message.type === 'buttons') {
    method = 'sendMessage';
    const keyboard = message.buttons.map(btn => [{
      text: btn.title,
      callback_data: String(btn.id).slice(0, 64),
    }]);
    body = { chat_id: chatId, text: formatText(message.body), parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } };
  } else if (message.type === 'list') {
    method = 'sendMessage';
    const keyboard = [];
    for (const section of (message.sections || [])) {
      for (const row of (section.rows || [])) {
        keyboard.push([{ text: row.title, callback_data: String(row.id).slice(0, 64) }]);
      }
    }
    body = { chat_id: chatId, text: formatText(message.body), parse_mode: 'HTML', reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined };
  } else {
    // Unknown type — skip
    return;
  }

  const res = await fetch(`${TG_API}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Telegram ${method}: ${json.description || 'Unknown error'}`);
  }
}

// ═════════════════════════════════════════════════════════════════
// Monthly cleanup: archive old sent/exhausted messages
// ═════════════════════════════════════════════════════════════════
export function cleanupMessageQueue() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(
    "DELETE FROM message_queue WHERE status IN ('sent', 'exhausted') AND created_at < ?"
  ).run(cutoff);
  if (result.changes > 0) console.log(`[MsgQueue] Cleaned up ${result.changes} old queue entries`);
}
