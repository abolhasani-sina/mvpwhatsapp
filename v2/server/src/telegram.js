import db from './db.js';

// Resolve bot token: env var first, then per-business settings
function getBotToken(businessId) {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  if (!businessId) return null;
  const settings = db.prepare(
    'SELECT telegram_bot_token FROM settings WHERE business_id = ?'
  ).get(businessId);
  return settings?.telegram_bot_token || null;
}

export async function sendTelegramNotification(businessId, text) {
  const token = getBotToken(businessId);
  if (!token) return;

  const settings = db.prepare(
    'SELECT telegram_chat_id FROM settings WHERE business_id = ?'
  ).get(businessId);
  if (!settings?.telegram_chat_id) return;

  await sendTelegramMessage(token, settings.telegram_chat_id, text);
}

export async function sendTelegramToChat(businessId, chatId, text) {
  const token = getBotToken(businessId);
  if (!token) {
    console.warn('[Telegram] No bot token found — set TELEGRAM_BOT_TOKEN env var or configure in settings');
    return;
  }
  await sendTelegramMessage(token, chatId, text);
}

async function sendTelegramMessage(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      console.error('[Telegram] API error:', json.description);
    } else {
      console.log(`[Telegram] Message sent to chat ${chatId}`);
    }
  } catch (err) {
    console.error('[Telegram] Network error:', err.message);
  }
}
