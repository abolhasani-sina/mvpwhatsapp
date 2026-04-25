// ── Telegram Bot Auto-Reply Engine ─────────────────────────────────
// Long-polling handler that receives customer messages on Telegram,
// processes them through the bot engine, and sends back replies.
// ───────────────────────────────────────────────────────────────────

import db from './db.js';
import { processIncoming } from './bot-engine.js';
import { decryptField } from './middleware/encryption.js';
import { enqueueMessage } from './message-queue.js';
import { notifyChatIdDetector } from './routes.js';
import { createLogger } from './logger.js';
import { telegramMessagesReceived, telegramPollingErrors } from './metrics.js';

const log = createLogger('telegram-bot');

const TG_API = 'https://api.telegram.org/bot';

// Active polling loops keyed by businessId
const activePollers = new Map();

// ═════════════════════════════════════════════════════════════════
// 1. TELEGRAM API HELPERS
// ═════════════════════════════════════════════════════════════════

function getBotToken(businessId) {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  const settings = db.prepare(
    'SELECT telegram_bot_token FROM settings WHERE business_id = ?'
  ).get(businessId);
  return settings?.telegram_bot_token ? decryptField(settings.telegram_bot_token) : null;
}

async function tgCall(token, method, body) {
  const res = await fetch(`${TG_API}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) log.error({ method, error: json.description }, `tgCall ${method} error`);
  return json;
}

async function sendPhotoFromDb(token, chatId, mediaId, caption) {
  const media = db.prepare('SELECT data, file_name, media_type FROM button_media WHERE id = ?').get(mediaId);
  if (!media || !media.data) {
    log.warn({ mediaId }, 'media not found or has no data');
    return;
  }

  // data is base64 — may have a data URI prefix like "data:image/jpeg;base64,"
  let base64 = media.data;
  const prefixMatch = base64.match(/^data:[^;]+;base64,/);
  if (prefixMatch) base64 = base64.slice(prefixMatch[0].length);

  const buffer = Buffer.from(base64, 'base64');
  const fileName = media.file_name || 'photo.jpg';

  // Detect content type from data URI or fall back
  let contentType = 'image/jpeg';
  const ctMatch = media.data.match(/^data:([^;]+);/);
  if (ctMatch) contentType = ctMatch[1];

  // Build multipart/form-data with proper boundary handling
  const boundary = '----NabzChatBoundary' + Date.now();
  const crlf = '\r\n';

  const fieldParts = [];
  // chat_id field
  fieldParts.push(
    `--${boundary}${crlf}` +
    `Content-Disposition: form-data; name="chat_id"${crlf}${crlf}` +
    `${chatId}`
  );
  // caption field
  if (caption) {
    fieldParts.push(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="caption"${crlf}${crlf}` +
      `${caption}`
    );
  }

  // Text before the file binary
  const fileHeader =
    `--${boundary}${crlf}` +
    `Content-Disposition: form-data; name="photo"; filename="${fileName}"${crlf}` +
    `Content-Type: ${contentType}${crlf}${crlf}`;

  const preFile = Buffer.from(fieldParts.join(crlf) + crlf + fileHeader, 'utf-8');
  const postFile = Buffer.from(`${crlf}--${boundary}--${crlf}`, 'utf-8');
  const body = Buffer.concat([preFile, buffer, postFile]);

  try {
    const res = await fetch(`${TG_API}${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    });
    const json = await res.json();
    if (!json.ok) log.error({ chatId, mediaId, error: json.description }, 'sendPhoto error');
    else log.debug({ chatId, mediaId }, 'photo sent');
  } catch (err) {
    log.error({ chatId, mediaId, err }, 'sendPhoto network error');
  }
}

// ═════════════════════════════════════════════════════════════════
// 2. SEND RESPONSES — convert internal messages to Telegram API
// ═════════════════════════════════════════════════════════════════

async function sendInternalMessages(token, chatId, messages, businessId) {
  for (const msg of messages) {
    if (msg.type === 'image') {
      // Images still sent directly (binary multipart — not suitable for queue)
      await sendPhotoFromDb(token, chatId, msg.mediaId, msg.caption);
    } else {
      // Queue text/button/list messages for reliable delivery
      if (businessId) {
        enqueueMessage(businessId, 'telegram', chatId, msg);
      } else {
        // Fallback to direct send if no businessId
        await sendDirectMessage(token, chatId, msg);
      }
    }
  }
}

async function sendDirectMessage(token, chatId, msg) {
  if (msg.type === 'text') {
    await tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text: formatTgText(msg.body),
      parse_mode: 'HTML',
    });
  } else if (msg.type === 'buttons') {
    const keyboard = msg.buttons.map(btn => [{
      text: btn.title,
      callback_data: String(btn.id).slice(0, 64),
    }]);
    await tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text: formatTgText(msg.body),
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard },
    });
  } else if (msg.type === 'list') {
    const keyboard = [];
    for (const section of (msg.sections || [])) {
      for (const row of (section.rows || [])) {
        keyboard.push([{
          text: row.title,
          callback_data: String(row.id).slice(0, 64),
        }]);
      }
    }
    await tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text: formatTgText(msg.body),
      parse_mode: 'HTML',
      reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined,
    });
  }
}

function formatTgText(text) {
  if (!text) return '';
  // Convert WhatsApp-style markdown to HTML
  return text
    .replace(/\*([^*]+)\*/g, '<b>$1</b>')
    .replace(/_([^_]+)_/g, '<i>$1</i>');
}

// ═════════════════════════════════════════════════════════════════
// 3. PROCESS INCOMING UPDATE
// ═════════════════════════════════════════════════════════════════

// Track processed update_ids to prevent re-processing
function isUpdateProcessed(businessId, updateId) {
  try {
    db.prepare(
      'INSERT INTO telegram_updates (business_id, update_id) VALUES (?, ?)'
    ).run(businessId, updateId);
    return false; // new — not processed before
  } catch {
    return true; // UNIQUE constraint violation = already processed
  }
}

async function handleUpdate(businessId, token, update) {
  telegramMessagesReceived.inc();

  // Deduplicate by update_id
  if (update.update_id && isUpdateProcessed(businessId, update.update_id)) {
    log.debug({ businessId, updateId: update.update_id }, 'skipping duplicate update_id');
    return;
  }

  let chatId, text, callbackData, userName;

  if (update.callback_query) {
    const cq = update.callback_query;
    chatId = cq.message?.chat?.id;
    callbackData = cq.data;
    userName = [cq.from?.first_name, cq.from?.last_name].filter(Boolean).join(' ');

    // Answer the callback to remove loading spinner
    tgCall(token, 'answerCallbackQuery', { callback_query_id: cq.id }).catch(() => {});
  } else if (update.message) {
    chatId = update.message.chat.id;
    text = update.message.text || '';
    userName = [update.message.from?.first_name, update.message.from?.last_name].filter(Boolean).join(' ');
  }

  if (!chatId) return;
  notifyChatIdDetector(businessId, chatId, userName);

  const input = { text: text || null, callbackData: callbackData || null };
  const responses = processIncoming(businessId, String(chatId), 'telegram', userName, input);
  await sendInternalMessages(token, chatId, responses, businessId);
}

// ═════════════════════════════════════════════════════════════════
// 4. LONG POLLING
// ═════════════════════════════════════════════════════════════════

export function startPolling(businessId) {
  if (activePollers.has(businessId)) {
    log.info({ businessId }, 'already polling');
    return { status: 'already_running' };
  }

  const token = getBotToken(businessId);
  if (!token) {
    log.warn({ businessId }, 'no bot token configured');
    return { status: 'no_token' };
  }

  const controller = new AbortController();
  activePollers.set(businessId, controller);

  log.info({ businessId }, 'starting polling');
  pollLoop(businessId, token, controller.signal);

  return { status: 'started' };
}

export function stopPolling(businessId) {
  const controller = activePollers.get(businessId);
  if (!controller) return { status: 'not_running' };

  controller.abort();
  activePollers.delete(businessId);
  log.info({ businessId }, 'stopped polling');
  return { status: 'stopped' };
}

export function getPollingStatus(businessId) {
  return { running: activePollers.has(businessId) };
}

export function getActivePollers() {
  return Array.from(activePollers.keys());
}


async function deleteWebhookIfExists(token) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`, { method: 'POST' });
    const j = await r.json();
    log.info({ ok: j.ok }, 'deleteWebhook result');
    await new Promise(res => setTimeout(res, 1000));
  } catch (err) {
    log.warn({ err }, 'deleteWebhook failed');
  }
}

async function pollLoop(businessId, token, signal) {
  await deleteWebhookIfExists(token);
  let offset = 0;

  while (!signal.aborted) {
    try {
      const res = await fetch(`${TG_API}${token}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset, timeout: 30, allowed_updates: ['message', 'callback_query'] }),
        signal,
      });

      const json = await res.json();
      if (!json.ok) {
        log.error({ businessId, error: json.description }, 'getUpdates error');
        telegramPollingErrors.inc();
        await sleep(5000);
        continue;
      }

      for (const update of json.result || []) {
        offset = update.update_id + 1;
        try {
          await handleUpdate(businessId, token, update);
        } catch (err) {
          log.error({ businessId, updateId: update.update_id, err }, 'error handling update');
          telegramPollingErrors.inc();
        }
      }
    } catch (err) {
      if (signal.aborted) break;
      log.error({ businessId, err }, 'poll error');
      telegramPollingErrors.inc();
      await sleep(5000);
    }
  }

  log.info({ businessId }, 'polling loop ended');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═════════════════════════════════════════════════════════════════
// 5. WEBHOOK HANDLER (alternative to polling)
// ═════════════════════════════════════════════════════════════════

export async function handleWebhook(businessId, updateBody) {
  const token = getBotToken(businessId);
  if (!token) return { error: 'No bot token configured' };
  await handleUpdate(businessId, token, updateBody);
  return { ok: true };
}

// Cleanup old telegram_updates records (keep last 24 hours)
export function cleanupTelegramUpdates() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const result = db.prepare('DELETE FROM telegram_updates WHERE processed_at < ?').run(cutoff);
  if (result.changes > 0) log.info({ deleted: result.changes }, 'cleaned up old update records');
}
