// ── Telegram Bot Auto-Reply Engine ─────────────────────────────────
// Long-polling handler that receives customer messages on Telegram,
// processes them through the bot engine, and sends back replies.
// ───────────────────────────────────────────────────────────────────

import db from './db.js';
import { processIncoming } from './bot-engine.js';
import { decryptField } from './middleware/encryption.js';
import { enqueueMessage } from './message-queue.js';
import { handleAISecretary, isAISecretaryActive, getBusinessBrain } from './ai-secretary.js';
import { notifyChatIdDetector } from './routes.js';
import { createLogger } from './logger.js';
import { telegramMessagesReceived, telegramPollingErrors } from './metrics.js';

const log = createLogger('telegram-bot');

const TG_API = 'https://api.telegram.org/bot';
const TG_BUFFER_MS = 8000;
const tgMsgBuffer = new Map();

async function processTgBuffer(bufferKey) {
  const b = tgMsgBuffer.get(bufferKey);
  if (!b) return;
  tgMsgBuffer.delete(bufferKey);
  const combinedText = b.messages.join('\n');
  log.info({ businessId: b.businessId, chatId: b.chatId, count: b.messages.length }, 'Processing buffered TG messages');
  const result = await handleAISecretary(b.businessId, String(b.chatId), b.userName || 'Customer', combinedText, b.brain, b.imageData || null, 'telegram');
  if (result && result.body) await tgCall(b.token, 'sendMessage', { chat_id: b.chatId, text: result.body, parse_mode: 'HTML' });
}

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
    if (update.message.from?.username) userName = update.message.from.username + (userName ? ' (' + userName + ')' : '');
  }

  if (!chatId) return;
  notifyChatIdDetector(businessId, chatId, userName);

  // Booking management callbacks bypass AI
  if (callbackData && callbackData.startsWith('bk_')) {
    await handleBookingCallback(businessId, token, chatId, update.callback_query?.message?.message_id, callbackData);
    return;
  }

  // AI Secretary mode
  if (isAISecretaryActive(businessId)) {
    // Upsert customer record for channel tracking
    try {
      const _tgDisplay = (update.message?.from?.username ? '@' + update.message.from.username : '') || userName || '';
    db.prepare('INSERT OR IGNORE INTO customers (business_id, channel, channel_user_id, name) VALUES (?, ?, ?, ?)').run(businessId, 'telegram', String(chatId), _tgDisplay);
      if (_tgDisplay) db.prepare('UPDATE customers SET name = ? WHERE business_id = ? AND channel = ? AND channel_user_id = ?').run(_tgDisplay, businessId, 'telegram', String(chatId));
    } catch(e) {}
    const brain = getBusinessBrain(businessId);
    let aiText = text || '';
    let aiImage = null;
    // Handle voice message
    if (update.message?.voice || update.message?.audio) {
      try {
        const fid = (update.message.voice || update.message.audio).file_id;
        const fi = await tgCall(token, 'getFile', { file_id: fid });
        if (fi.ok && fi.result.file_path) {
          const furl = `https://api.telegram.org/file/bot${token}/${fi.result.file_path}`;
          const abuf = Buffer.from(await (await fetch(furl)).arrayBuffer());
          const fd = new FormData();
          fd.append('file', new Blob([abuf], { type: 'audio/ogg' }), 'voice.ogg');
          fd.append('model', 'whisper-1');
          fd.append('prompt', 'Beauty salon booking inquiry. Customer may speak English, Arabic, or Persian.');
          const wr = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }, body: fd
          });
          const wj = await wr.json();
          aiText = wj.text || '';
        }
      } catch(e) { log.error({ err: e }, 'Telegram voice transcription failed'); }
    }
    // Handle image
    if (update.message?.photo) {
      try {
        const photo = update.message.photo[update.message.photo.length - 1];
        const fi = await tgCall(token, 'getFile', { file_id: photo.file_id });
        if (fi.ok && fi.result.file_path) {
          const furl = `https://api.telegram.org/file/bot${token}/${fi.result.file_path}`;
          const ibuf = Buffer.from(await (await fetch(furl)).arrayBuffer());
          aiImage = { base64: ibuf.toString('base64'), mimeType: 'image/jpeg' };
          if (!aiText) aiText = update.message.caption || '';
        }
      } catch(e) { log.error({ err: e }, 'Telegram image download failed'); }
    }
    if (!aiText && !aiImage) return;
    // Intercept /start  send welcome once, save to history so Luna won't re-greet
    if (aiText.trim() === '/start') {
      const _wb = brain;
      const _wName = _wb?.name || 'Luna';
      const _wSalon = _wb?.salon_name || _wb?.business_name || '';
      const _wMsg = 'Hi! I\'m ' + _wName + (_wSalon ? ' from ' + _wSalon : '') + ' \uD83D\uDE0A How can I help you today?';
      await tgCall(token, 'sendMessage', { chat_id: chatId, text: _wMsg, parse_mode: 'HTML' });
      db.prepare("INSERT INTO ai_conversations (business_id, customer_phone, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)").run(businessId, String(chatId), _wMsg, new Date().toISOString());
      return;
    }
    // 8-second buffer to combine chunked messages
    const _bKey = businessId + '_' + chatId;
    const _existing = tgMsgBuffer.get(_bKey);
    if (_existing) {
      clearTimeout(_existing.timer);
      if (aiText) _existing.messages.push(aiText);
      if (aiImage) _existing.imageData = aiImage;
      _existing.userName = userName || _existing.userName;
    } else {
      tgMsgBuffer.set(_bKey, { messages: aiText ? [aiText] : [], token, chatId, businessId, userName, brain, imageData: aiImage });
    }
    tgMsgBuffer.get(_bKey).timer = setTimeout(() => processTgBuffer(_bKey), TG_BUFFER_MS);
    return;
  }

  // Fallback: button flows
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

async function handleBookingCallback(businessId, token, chatId, messageId, callbackData) {
  const parts = callbackData.split(':');
  const action = parts[0];
  if (action === 'bk_noop') return;
  if (action.startsWith('bk_r')) { await handleRescheduleFlow(businessId, token, chatId, messageId, callbackData); return; }
  const subId = parseInt(parts[1]);
  if (!subId) return;
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(subId);
  if (!sub) return;
  const data = JSON.parse(sub.data || '{}');
  const customerName = data['Customer Name'] || 'Customer';
  const service = data['Service'] || 'service';
  const date = data['Preferred Date'] || 'appointment';
  const time = data['Preferred Time'] || '';
  const waNumber = data['WhatsApp Number'];


  let newStatus, doneText, customerMsg;
  if (action === 'bk_confirm') {
    newStatus = 'in_progress';
    doneText = '✅ Confirmed: ' + customerName + ' — ' + service + ' on ' + date;
    customerMsg = '✅ Booking Confirmed!\n\n👤 ' + customerName + '\n📋 ' + service + '\n📅 ' + date + (time ? '\n🕐 ' + time : '') + '\n\nWe look forward to seeing you ✨';
  } else if (action === 'bk_cancel') {
    newStatus = 'cancelled';
    doneText = '❌ Cancelled: ' + customerName + ' — ' + service;
    customerMsg = '❌ Booking Cancelled\n\n👤 ' + customerName + '\n📋 ' + service + '\n📅 ' + date + (time ? '\n🕐 ' + time : '') + '\n\nSorry for the inconvenience. Message us to reschedule 🙏';
  } else { return; }

  db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(newStatus, subId);

  // Google Calendar: create event when owner manually confirms
  if (action === 'bk_confirm') {
    try {
      const { getCalendarStatus, createBookingEvent } = await import('./google-calendar.js');
      const _calSt = getCalendarStatus(businessId);
      if (_calSt.connected && _calSt.confirmationMode === 'manual') {
        const _evDate = data['Preferred Date'] || '';
        const _evTime = data['Preferred Time'] || '09:00';
        const _evPhone = data['WhatsApp Number'] || data['_channel_id'] || String(chatId);
        // Resolve natural language dates to YYYY-MM-DD
        let _resolvedDate = _evDate;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(_evDate)) {
          const _now = new Date();
          const _dl = (_evDate || '').toLowerCase().trim();
          if (_dl === 'tomorrow' || _dl === '\u0641\u0631\u062f\u0627' || _dl === '\u063a\u062f\u0627') {
            const _tom = new Date(_now); _tom.setDate(_tom.getDate() + 1);
            _resolvedDate = _tom.getFullYear() + '-' + String(_tom.getMonth()+1).padStart(2,'0') + '-' + String(_tom.getDate()).padStart(2,'0');
          } else if (_dl === 'today' || _dl === '\u0627\u0645\u0631\u0648\u0632') {
            _resolvedDate = _now.getFullYear() + '-' + String(_now.getMonth()+1).padStart(2,'0') + '-' + String(_now.getDate()).padStart(2,'0');
          }
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(_resolvedDate)) {
          // Look up correct service duration from brain
          const { getServiceDuration } = await import('./google-calendar.js');
          const _brain = db.prepare('SELECT services, booking_buffer FROM business_brain WHERE business_id = ?').get(businessId);
          const _svcDur = getServiceDuration(_brain, service);
          createBookingEvent(businessId, _resolvedDate, _evTime, _svcDur, customerName, service, _evPhone)
            .catch(e => log.warn({ err: e.message }, 'Calendar event skipped'));
        } else {
          log.warn({ businessId, date: _evDate }, 'Calendar event skipped: unresolved date');
        }
      }
    } catch(_gcalErr) { log.warn({ err: _gcalErr.message }, 'Calendar event error'); }
  }

  // Remove buttons from original, then send styled reply
  const _custChannel = data['_channel'] || 'whatsapp';
  const _chanId = data['_channel_id'];
  if (messageId) {
    await tgCall(token, 'editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
    const _notifChannel = _custChannel === 'telegram' ? 'Telegram' : _custChannel === 'instagram' ? 'Instagram' : 'WhatsApp';
    const _displayId = waNumber || _chanId || '';
    const _replyText = newStatus === 'in_progress'
      ? ('✅ Booking Confirmed\n\n👤 ' + customerName + '  —  ' + _displayId + '\n📋 ' + service + '\n\nCustomer notified on ' + _notifChannel + '.')
      : ('❌ Booking Cancelled\n\n👤 ' + customerName + '  —  ' + _displayId + '\n📋 ' + service + '\n\nCustomer notified on ' + _notifChannel + '.');
    await tgCall(token, 'sendMessage', { chat_id: chatId, text: _replyText, parse_mode: 'HTML', reply_to_message_id: messageId });
  }
  if (_custChannel === 'telegram' && _chanId) {
    try {
      // Use brain templates if available, with language-aware fallback
      const _tgBrain = db.prepare('SELECT msg_confirmed, msg_cancelled FROM business_brain WHERE business_id = ?').get(businessId);
      const _rp = (t, n, s, d) => (t || '').replace(/{name}/g, n).replace(/{service}/g, s).replace(/{date}/g, d).replace(/\\n/g, '\n');
      const _tgConvText = (db.prepare("SELECT content FROM ai_conversations WHERE business_id = ? AND customer_phone = ? AND role = 'user' ORDER BY id ASC LIMIT 3").all(businessId, String(_chanId)) || []).map(m => m.content).join(' ');
      const _tgHasPersian = /[\u067E\u0686\u06CC\u06A9\u06AF]/.test(_tgConvText);
      const _tgHasArabic = /[\u0600-\u06FF]/.test(_tgConvText) && !_tgHasPersian;
      if (newStatus === 'in_progress') {
        // Language takes priority over brain template for Persian/Arabic customers
        if (_tgHasPersian) customerMsg = '\u2705 \u0631\u0632\u0631\u0648 \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F!\n\n\uD83D\uDC64 ' + customerName + '\n\uD83D\uDCCB ' + service + '\n\uD83D\uDCC5 ' + date + (time ? '\n\uD83D\uDD50 ' + time : '') + '\n\n\u0645\u0646\u062A\u0638\u0631\u062A\u0648\u0646 \u0647\u0633\u062A\u06CC\u0645 \u2728';
        else if (_tgHasArabic) customerMsg = '\u2705 \u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u062D\u062C\u0632\u0643!\n\n\uD83D\uDC64 ' + customerName + '\n\uD83D\uDCCB ' + service + '\n\uD83D\uDCC5 ' + date + (time ? '\n\uD83D\uDD50 ' + time : '') + '\n\n\u0646\u062A\u0637\u0644\u0639 \u0644\u0631\u0624\u064A\u062A\u0643 \u2728';
        else if (_tgBrain?.msg_confirmed) customerMsg = _rp(_tgBrain.msg_confirmed, customerName, service, date);
      } else if (newStatus === 'cancelled') {
        if (_tgHasPersian) customerMsg = '\u274C \u0631\u0632\u0631\u0648 \u0644\u063A\u0648 \u0634\u062F\n\n\uD83D\uDC64 ' + customerName + '\n\uD83D\uDCCB ' + service + '\n\uD83D\uDCC5 ' + date + (time ? '\n\uD83D\uDD50 ' + time : '') + '\n\n\u0645\u062A\u0623\u0633\u0641\u0627\u0646\u0647. \u0628\u0631\u0627\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0642\u062A \u0628\u0627 \u0645\u0627 \u0645\u0633\u06CC\u062C \u0628\u062F\u06CC\u062F \uD83D\uDE4F';
        else if (_tgHasArabic) customerMsg = '\u274C \u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u062C\u0632\n\n\uD83D\uDC64 ' + customerName + '\n\uD83D\uDCCB ' + service + '\n\uD83D\uDCC5 ' + date + (time ? '\n\uD83D\uDD50 ' + time : '') + '\n\n\u0646\u0639\u062A\u0630\u0631. \u0631\u0627\u0633\u0644\u0646\u0627 \u0644\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0648\u0639\u062F \uD83D\uDE4F';
        else if (_tgBrain?.msg_cancelled) customerMsg = _rp(_tgBrain.msg_cancelled, customerName, service, date);
      }
      await tgCall(token, 'sendMessage', { chat_id: _chanId, text: customerMsg, parse_mode: 'HTML' });
      // Save outgoing message to conversation history
      db.prepare("INSERT INTO ai_conversations (business_id, customer_phone, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)").run(businessId, String(_chanId), customerMsg, new Date().toISOString());
      log.info({ businessId, subId, newStatus, _chanId }, 'booking callback TG sent');
    } catch(e) { log.error({ err: e }, 'TG notify from booking callback failed'); }
  } else if (waNumber) {
    try {
      const settings = db.prepare('SELECT whatsapp_phone_number_id, whatsapp_access_token FROM settings WHERE business_id = ?').get(businessId);
      if (settings?.whatsapp_phone_number_id && settings?.whatsapp_access_token) {
        let accessToken = settings.whatsapp_access_token;
        try { accessToken = decryptField(accessToken); } catch(e) {}
        const brain = db.prepare('SELECT msg_confirmed, msg_cancelled FROM business_brain WHERE business_id = ?').get(businessId);
        const rp = (t, n, s, d) => (t || '').replace(/{name}/g, n).replace(/{service}/g, s).replace(/{date}/g, d).replace(/\\n/g, '\n');
        if (newStatus === 'in_progress' && brain?.msg_confirmed) customerMsg = rp(brain.msg_confirmed, customerName, service, date);
        if (newStatus === 'cancelled' && brain?.msg_cancelled) customerMsg = rp(brain.msg_cancelled, customerName, service, date);
        await fetch('https://graph.facebook.com/v18.0/' + settings.whatsapp_phone_number_id + '/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
          body: JSON.stringify({
            messaging_product: 'whatsapp', recipient_type: 'individual',
            to: waNumber, type: 'text',
            text: { body: customerMsg, preview_url: false }
          })
        });
        log.info({ businessId, subId, newStatus, waNumber }, 'booking callback WA sent');
      }
    } catch(e) { log.error({ err: e }, 'WA notify from booking callback failed'); }
  }
}


//  RESCHEDULE FLOW 
const rescheduleState = new Map();

function getRState(businessId, subId) {
  const key = String(businessId);
  if (!rescheduleState.has(key) || rescheduleState.get(key).subId !== subId) {
    const now = new Date();
    const vm = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
    rescheduleState.set(key, { subId, selectedSlots: new Set(), viewMonth: vm });
  }
  return rescheduleState.get(key);
}

function formatSlotDisplay(slotKey) {
  const p = slotKey.split(':');
  const date = new Date(p[0] + 'T00:00:00');
  const D = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return D[date.getDay()] + ', ' + M[date.getMonth()] + ' ' + date.getDate() + ' at ' + p[1] + ':00';
}

function buildCalendarKeyboard(subId, viewMonth, state) {
  const p = viewMonth.split('-');
  const year = parseInt(p[0]), month = parseInt(p[1]);
  const _tz = 4 * 3600 * 1000;
  const _dubaiNow = new Date(Date.now() + _tz);
  const todayStr = _dubaiNow.toISOString().split('T')[0];
  const MNAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const prevM = month === 1 ? (year-1) + '-12' : year + '-' + String(month-1).padStart(2,'0');
  const nextM = month === 12 ? (year+1) + '-01' : year + '-' + String(month+1).padStart(2,'0');
  const keyboard = [];
  keyboard.push([
    { text: '◄', callback_data: 'bk_rcal:' + subId + ':' + prevM },
    { text: MNAMES[month-1] + ' ' + year, callback_data: 'bk_noop' },
    { text: '►', callback_data: 'bk_rcal:' + subId + ':' + nextM }
  ]);
  keyboard.push(['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => ({ text: d, callback_data: 'bk_noop' })));
  const firstDow = new Date(year, month-1, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  let row = [];
  for (let i = 0; i < offset; i++) row.push({ text: ' ', callback_data: 'bk_noop' });
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = year + '-' + String(month).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const past = ds < todayStr;
    const hasSlot = [...state.selectedSlots].some(s => s.startsWith(ds + ':'));
    const txt = past ? '·' : (hasSlot ? '●' + d : String(d));
    row.push({ text: txt, callback_data: past ? 'bk_noop' : 'bk_rday:' + subId + ':' + ds });
    if (row.length === 7) { keyboard.push(row); row = []; }
  }
  while (row.length > 0 && row.length < 7) row.push({ text: ' ', callback_data: 'bk_noop' });
  if (row.length === 7) keyboard.push(row);
  const count = state.selectedSlots.size;
  if (count > 0) keyboard.push([{ text: '✅ Send ' + count + ' slot' + (count > 1 ? 's' : '') + ' to customer', callback_data: 'bk_rsend:' + subId }]);
  return keyboard;
}

function buildTimeSlotsKeyboard(subId, dateStr, hoursJson, state) {
  const date = new Date(dateStr + 'T00:00:00');
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const h = (hoursJson || {})[DAYS[date.getDay()]];
  if (!h || h.closed) return [
    [{ text: 'Closed this day — pick another date', callback_data: 'bk_noop' }],
    [{ text: '◄ Back', callback_data: 'bk_rback:' + subId }]
  ];
  const openH = parseInt(h.open.split(':')[0]);
  const closeH = parseInt(h.close.split(':')[0]);
  const _tz2 = 4 * 3600 * 1000;
  const _dNow = new Date(Date.now() + _tz2);
  const todayStr = _dNow.toISOString().split('T')[0];
  const isToday = dateStr === todayStr;
  const currentHour = _dNow.getUTCHours();
  const keyboard = [];
  let row = [];
  for (let hr = openH; hr < closeH; hr++) {
    const hStr = String(hr).padStart(2,'0');
    const slotKey = dateStr + ':' + hStr;
    const past = isToday && hr <= currentHour;
    const sel = state.selectedSlots.has(slotKey);
    const txt = past ? '·' : (sel ? '✓ ' + hStr + ':00' : hStr + ':00');
    row.push({ text: txt, callback_data: past ? 'bk_noop' : 'bk_rst:' + subId + ':' + dateStr + ':' + hStr });
    if (row.length === 4) { keyboard.push(row); row = []; }
  }
  if (row.length > 0) keyboard.push(row);
  keyboard.push([{ text: '◄ Back to calendar', callback_data: 'bk_rback:' + subId }]);
  return keyboard;
}

async function handleRescheduleFlow(businessId, token, chatId, messageId, callbackData) {
  const parts = callbackData.split(':');
  const action = parts[0];
  const subId = parseInt(parts[1]);
  if (!subId) return;
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(subId);
  if (!sub) return;
  const submData = JSON.parse(sub.data || '{}');
  const customerName = submData['Customer Name'] || 'Customer';
  const service = submData['Service'] || 'service';
  const waNumber = submData['WhatsApp Number'];
  const brain = db.prepare('SELECT hours FROM business_brain WHERE business_id = ?').get(businessId);
  let hoursJson = JSON.parse(brain?.hours || '{}');
  if (typeof hoursJson === 'string') hoursJson = JSON.parse(hoursJson);
  const state = getRState(businessId, subId);
  const D = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (action === 'bk_reschedule') {
    if (messageId) await tgCall(token, 'editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
    const kb = buildCalendarKeyboard(subId, state.viewMonth, state);
    await tgCall(token, 'sendMessage', {
      chat_id: chatId,
      text: '📅 Select dates & times to offer\n' + customerName + ' — ' + service,
      parse_mode: 'HTML', reply_markup: { inline_keyboard: kb }
    });

  } else if (action === 'bk_rcal') {
    const newMonth = parts[2];
    if (newMonth) state.viewMonth = newMonth;
    const kb = buildCalendarKeyboard(subId, state.viewMonth, state);
    await tgCall(token, 'editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: kb } });

  } else if (action === 'bk_rday') {
    const dateStr = parts[2];
    if (!dateStr) return;
    const date = new Date(dateStr + 'T00:00:00');
    const dateLabel = D[date.getDay()] + ', ' + M[date.getMonth()] + ' ' + date.getDate();
    const kb = buildTimeSlotsKeyboard(subId, dateStr, hoursJson, state);
    await tgCall(token, 'editMessageText', {
      chat_id: chatId, message_id: messageId,
      text: '📅 ' + dateLabel + ' — select times:\n' + customerName + ' — ' + service,
      parse_mode: 'HTML', reply_markup: { inline_keyboard: kb }
    });

  } else if (action === 'bk_rst') {
    const dateStr = parts[2], hourStr = parts[3];
    if (!dateStr || !hourStr) return;
    const slotKey = dateStr + ':' + hourStr;
    if (state.selectedSlots.has(slotKey)) state.selectedSlots.delete(slotKey);
    else state.selectedSlots.add(slotKey);
    const date = new Date(dateStr + 'T00:00:00');
    const dateLabel = D[date.getDay()] + ', ' + M[date.getMonth()] + ' ' + date.getDate();
    const kb = buildTimeSlotsKeyboard(subId, dateStr, hoursJson, state);
    await tgCall(token, 'editMessageText', {
      chat_id: chatId, message_id: messageId,
      text: '📅 ' + dateLabel + ' — select times:\n' + customerName + ' — ' + service,
      parse_mode: 'HTML', reply_markup: { inline_keyboard: kb }
    });

  } else if (action === 'bk_rback') {
    const kb = buildCalendarKeyboard(subId, state.viewMonth, state);
    await tgCall(token, 'editMessageText', {
      chat_id: chatId, message_id: messageId,
      text: '📅 Select dates & times to offer\n' + customerName + ' — ' + service,
      parse_mode: 'HTML', reply_markup: { inline_keyboard: kb }
    });

  } else if (action === 'bk_rsend') {
    if (state.selectedSlots.size === 0) return;
    // Immediately clear state + disable button to prevent double-send on rapid taps
    const slots = [...state.selectedSlots].sort();
    rescheduleState.delete(String(businessId));
    if (messageId) await tgCall(token, 'editMessageText', { chat_id: chatId, message_id: messageId, text: '\uD83D\uDCE4 Sending slots to customer...', parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } });
    const slotLines = slots.map(s => '• ' + formatSlotDisplay(s)).join('\n');
    const _rCustChannel = submData['_channel'] || 'whatsapp';
    const _rChanId = submData['_channel_id'];
    const _langId = _rCustChannel === 'telegram' ? String(_rChanId) : waNumber;
    const _recentMsgs = db.prepare("SELECT content FROM ai_conversations WHERE business_id = ? AND customer_phone = ? AND role = 'user' ORDER BY id DESC LIMIT 5").all(businessId, _langId);
    const _convText = (_recentMsgs || []).map(m => m.content).join(' ') + customerName + service;
    const _hasFarsi = /[\u067E\u0686\u06CC\u06A9\u06AF\u0641\u06BE]/.test(_convText);
    const _hasArabic = /[\u0600-\u06FF]/.test(_convText) && !_hasFarsi;
    let waMsg;
    if (_hasFarsi) {
      waMsg = '\u0633\u0644\u0627\u0645 ' + customerName + '! \u0645\u062A\u0623\u0633\u0641\u0627\u0646\u0647 \u0646\u06CC\u0627\u0632 \u062F\u0627\u0631\u06CC\u0645 \u0648\u0642\u062A ' + service + ' \u0634\u0645\u0627 \u0631\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u062F\u0647\u06CC\u0645.\n\n\u0632\u0645\u0627\u0646\u200C\u0647\u0627\u06CC \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u06CC:\n\n' + slotLines + '\n\n\u0647\u0631 \u06A9\u062F\u0627\u0645 \u06A9\u0647 \u0631\u0627\u062D\u062A\u200C\u062A\u0631\u06CC\u062F \u0628\u06AF\u06CC\u06CC\u062F\u060C \u06CC\u0627 \u0632\u0645\u0627\u0646 \u062F\u06CC\u06AF\u0631\u06CC \u067E\u06CC\u0634\u0646\u0647\u0627\u062F \u062F\u0647\u06CC\u062F 😊';
    } else if (_hasArabic) {
      waMsg = '\u0645\u0631\u062D\u0628\u0627\u064B ' + customerName + '! \u0646\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0625\u0639\u0627\u062F\u0629 \u062C\u062F\u0648\u0644\u0629 \u0645\u0648\u0639\u062F ' + service + ' \u0627\u0644\u062E\u0627\u0635 \u0628\u0643.\n\n\u0627\u0644\u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629:\n\n' + slotLines + '\n\n\u0623\u062E\u0628\u0631\u0646\u0627 \u0628\u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0623\u0648 \u0627\u0642\u062A\u0631\u062D \u0648\u0642\u062A\u0627\u064B \u0622\u062E\u0631 😊';
    } else {
      waMsg = 'Hi ' + customerName + '! We need to reschedule your ' + service + ' appointment.\n\nHere are some available times:\n\n' + slotLines + '\n\nJust reply with whichever works best, or suggest another time 😊';
    }
    const _offerPhone = _rCustChannel === 'telegram' ? String(_rChanId) : waNumber;
    db.prepare("INSERT INTO reschedule_offers (submission_id, business_id, customer_phone, offered_slots, status) VALUES (?, ?, ?, ?, 'pending')").run(subId, businessId, _offerPhone, JSON.stringify(slots));
    if (_rCustChannel === 'telegram' && _rChanId) {
      try {
        await tgCall(token, 'sendMessage', { chat_id: _rChanId, text: waMsg });
        log.info({ businessId, subId, _rChanId }, 'reschedule offer sent via Telegram');
      } catch(e) { log.error({ err: e }, 'TG reschedule offer failed'); }
    } else if (waNumber) {
      try {
        const settings = db.prepare('SELECT whatsapp_phone_number_id, whatsapp_access_token FROM settings WHERE business_id = ?').get(businessId);
        if (settings?.whatsapp_phone_number_id && settings?.whatsapp_access_token) {
          let waToken = settings.whatsapp_access_token;
          try { waToken = decryptField(waToken); } catch(e) {}
          await fetch('https://graph.facebook.com/v18.0/' + settings.whatsapp_phone_number_id + '/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + waToken },
            body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: waNumber, type: 'text', text: { body: waMsg, preview_url: false } })
          });
          log.info({ businessId, subId, waNumber }, 'reschedule offer sent via WhatsApp');
        }
      } catch(e) { log.error({ err: e }, 'WA reschedule offer failed'); }
    }
    // Save outgoing reschedule offer to conversation history
    db.prepare("INSERT INTO ai_conversations (business_id, customer_phone, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)").run(businessId, _offerPhone, waMsg, new Date().toISOString());
    const summary = slots.map(s => formatSlotDisplay(s)).join(', ');
    const _slotListFmt = slots.map(s => '• ' + formatSlotDisplay(s)).join('\n');
    const _rsText = '📤 Reschedule Options Sent\n\n'
      + '👤 ' + customerName + '  —  ' + waNumber + '\n'
      + '📋 ' + service + '\n\n' + _slotListFmt + '\n\nWaiting for customer reply...';
    const _bookMsgId = submData._telegram_msg_id;
    // Edit calendar message to confirm sent
    if (messageId) await tgCall(token, 'editMessageText', { chat_id: chatId, message_id: messageId, text: '📤 Options sent to customer.', parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } });
    // Reply to original booking notification
    if (_bookMsgId) await tgCall(token, 'sendMessage', { chat_id: chatId, text: _rsText, parse_mode: 'HTML', reply_to_message_id: _bookMsgId });
    else await tgCall(token, 'sendMessage', { chat_id: chatId, text: _rsText, parse_mode: 'HTML' });
    rescheduleState.delete(String(businessId));
  }
}
