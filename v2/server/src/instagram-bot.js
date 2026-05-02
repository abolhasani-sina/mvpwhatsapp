// Instagram Messaging API Handler
import db from './db.js';
import { decryptField } from './middleware/encryption.js';
import { processIncoming } from './bot-engine.js';
import { createLogger } from './logger.js';

const log = createLogger('instagram-bot');
const IG_API = 'https://graph.facebook.com/v18.0';

// Send a single message via Instagram Messaging API
async function sendInstagramMessage(pageId, accessToken, recipientId, message) {
  const body = buildPayload(recipientId, message);
  if (!body) return;
  try {
    const res = await fetch(`${IG_API}/${pageId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.error) {
      log.error({ error: json.error }, 'Instagram send error');
    }
    return json;
  } catch (err) {
    log.error({ err }, 'Instagram send failed');
  }
}

// Build Instagram Send API payload from bot-engine response
// Instagram uses quick_replies for buttons (max 13), generic template for rich cards
function buildPayload(recipientId, message) {
  const recipient = { id: recipientId };

  if (message.type === 'text') {
    return { recipient, message: { text: message.body } };
  }

  if (message.type === 'buttons') {
    // Instagram: use quick replies (max 13 buttons)
    const qr = message.buttons.slice(0, 13).map(b => ({
      content_type: 'text',
      title: b.title.slice(0, 20),
      payload: b.id,
    }));
    return { recipient, message: { text: message.body, quick_replies: qr } };
  }

  if (message.type === 'list') {
    // Flatten list sections into quick replies
    const rows = (message.sections || []).flatMap(s => s.rows || []);
    const qr = rows.slice(0, 13).map(r => ({
      content_type: 'text',
      title: r.title.slice(0, 20),
      payload: r.id,
    }));
    return { recipient, message: { text: message.body, quick_replies: qr } };
  }

  return null;
}

// Get Instagram credentials for a business
function getIGCredentials(businessId) {
  const settings = db.prepare(
    'SELECT instagram_page_id, instagram_access_token FROM settings WHERE business_id = ?'
  ).get(businessId);
  if (settings?.instagram_access_token) {
    try { settings.instagram_access_token = decryptField(settings.instagram_access_token); } catch(e) {}
  }
  return settings || null;
}

// Handle incoming Instagram webhook payload
export async function handleInstagramWebhook(body) {
  try {
    const entry = body?.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging) return;

    // Ignore echoes (messages sent by the page itself)
    if (messaging.message?.is_echo) return;

    const pageId = entry?.id;
    if (!pageId) return;

    // Find which business this Instagram page belongs to
    const settings = db.prepare(
      'SELECT business_id, instagram_page_id, instagram_access_token FROM settings WHERE instagram_page_id = ?'
    ).get(pageId);

    if (!settings) {
      log.warn({ pageId }, 'No business found for Instagram page_id');
      return;
    }

    let { business_id: businessId, instagram_page_id: igPageId, instagram_access_token: accessToken } = settings;
    try { accessToken = decryptField(accessToken); } catch(e) {}

    const senderId = messaging.sender?.id;
    if (!senderId) return;

    // Ignore messages older than 5 minutes (webhook retries)
    if (messaging.timestamp) {
      const msgAge = Date.now() / 1000 - messaging.timestamp / 1000;
      if (msgAge > 300) { log.info({ msgAge: Math.round(msgAge) }, 'Ignoring old Instagram webhook retry'); return; }
    }

    let input = {};
    const msg = messaging.message;
    const postback = messaging.postback;

    if (postback) {
      // Button/quick reply postback
      input = { callbackData: postback.payload, text: postback.title || postback.payload };
    } else if (msg?.quick_reply) {
      input = { callbackData: msg.quick_reply.payload, text: msg.text || msg.quick_reply.payload };
    } else if (msg?.text) {
      input = { text: msg.text };
    } else {
      // Unsupported message type (sticker, image, etc.) - ignore
      return;
    }

    const userName = senderId; // Instagram doesn't expose names without additional permission

    log.info({ businessId, senderId, input }, 'Instagram message received');

    // Process through bot engine
    const responses = processIncoming(businessId, senderId, 'instagram', userName, input);

    // Send responses back
    for (const response of responses) {
      await sendInstagramMessage(igPageId, accessToken, senderId, response);
      if (responses.length > 1) await new Promise(r => setTimeout(r, 300));
    }

  } catch (err) {
    log.error({ err }, 'Instagram webhook handler error');
  }
}
