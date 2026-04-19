// ── Telegram Bot Auto-Reply Engine ─────────────────────────────────
// Long-polling handler that receives customer messages on Telegram,
// processes them through the bot engine, and sends back replies.
// ───────────────────────────────────────────────────────────────────

import db from './db.js';
import { processIncoming } from './bot-engine.js';
import { decryptField } from './middleware/encryption.js';

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
  if (!json.ok) console.error(`[TG Bot] ${method} error:`, json.description);
  return json;
}

async function sendPhotoFromDb(token, chatId, mediaId, caption) {
  const media = db.prepare('SELECT data, file_name, media_type FROM button_media WHERE id = ?').get(mediaId);
  if (!media || !media.data) {
    console.warn(`[TG Bot] Media ${mediaId} not found or has no data`);
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
  const boundary = '----BotDeskBoundary' + Date.now();
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
    if (!json.ok) console.error(`[TG Bot] sendPhoto error:`, json.description);
    else console.log(`[TG Bot] Photo sent to chat ${chatId} (media ${mediaId})`);
  } catch (err) {
    console.error(`[TG Bot] sendPhoto network error:`, err.message);
  }
}

// ═════════════════════════════════════════════════════════════════
// 2. SEND RESPONSES — convert internal messages to Telegram API
// ═════════════════════════════════════════════════════════════════

async function sendInternalMessages(token, chatId, messages) {
  for (const msg of messages) {
    if (msg.type === 'image') {
      await sendPhotoFromDb(token, chatId, msg.mediaId, msg.caption);
    } else if (msg.type === 'text') {
      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: formatTgText(msg.body),
        parse_mode: 'HTML',
      });
    } else if (msg.type === 'buttons') {
      const keyboard = msg.buttons.map(btn => [{
        text: btn.title,
        callback_data: btn.id.slice(0, 64),
      }]);
      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: formatTgText(msg.body),
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard },
      });
    } else if (msg.type === 'list') {
      // Lists → inline keyboard with all rows
      const keyboard = [];
      for (const section of (msg.sections || [])) {
        for (const row of (section.rows || [])) {
          keyboard.push([{
            text: row.title,
            callback_data: row.id.slice(0, 64),
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

async function handleUpdate(businessId, token, update) {
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

  const input = { text: text || null, callbackData: callbackData || null };
  const responses = processIncoming(businessId, String(chatId), 'telegram', userName, input);
  await sendInternalMessages(token, chatId, responses);
}

// ═════════════════════════════════════════════════════════════════
// 4. LONG POLLING
// ═════════════════════════════════════════════════════════════════

export function startPolling(businessId) {
  if (activePollers.has(businessId)) {
    console.log(`[TG Bot] Already polling for business ${businessId}`);
    return { status: 'already_running' };
  }

  const token = getBotToken(businessId);
  if (!token) {
    console.warn(`[TG Bot] No bot token for business ${businessId}`);
    return { status: 'no_token' };
  }

  const controller = new AbortController();
  activePollers.set(businessId, controller);

  console.log(`[TG Bot] Starting polling for business ${businessId}`);
  pollLoop(businessId, token, controller.signal);

  return { status: 'started' };
}

export function stopPolling(businessId) {
  const controller = activePollers.get(businessId);
  if (!controller) return { status: 'not_running' };

  controller.abort();
  activePollers.delete(businessId);
  console.log(`[TG Bot] Stopped polling for business ${businessId}`);
  return { status: 'stopped' };
}

export function getPollingStatus(businessId) {
  return { running: activePollers.has(businessId) };
}

export function getActivePollers() {
  return Array.from(activePollers.keys());
}

async function pollLoop(businessId, token, signal) {
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
        console.error(`[TG Bot] getUpdates error for business ${businessId}:`, json.description);
        await sleep(5000);
        continue;
      }

      for (const update of json.result || []) {
        offset = update.update_id + 1;
        try {
          await handleUpdate(businessId, token, update);
        } catch (err) {
          console.error(`[TG Bot] Error handling update ${update.update_id}:`, err.message);
        }
      }
    } catch (err) {
      if (signal.aborted) break;
      console.error(`[TG Bot] Poll error for business ${businessId}:`, err.message);
      await sleep(5000);
    }
  }

  console.log(`[TG Bot] Polling loop ended for business ${businessId}`);
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
