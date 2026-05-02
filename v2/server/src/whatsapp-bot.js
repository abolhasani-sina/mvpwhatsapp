//  WhatsApp Cloud API Message Handler 
// [ADDED: whatsapp-webhook]
import db from './db.js';
import { decryptField } from './middleware/encryption.js';
import { processIncoming } from './bot-engine.js';
import { createLogger } from './logger.js';

const log = createLogger('whatsapp-bot');
const WA_API = 'https://graph.facebook.com/v18.0';

//  Send a message via WhatsApp Cloud API 
async function sendWhatsAppMessage(phoneNumberId, accessToken, to, message) {
  const body = buildPayload(to, message);
  if (!body) return;

  try {
    const res = await fetch(`${WA_API}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.error) {
      log.error({ error: json.error }, 'WhatsApp send error');
    }
    return json;
  } catch (err) {
    log.error({ err }, 'WhatsApp send failed');
  }
}

//  Build WhatsApp API payload from bot-engine response 
function buildPayload(to, message) {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };

  if (message.type === 'text') {
    return { ...base, type: 'text', text: { body: message.body, preview_url: false } };
  }

  if (message.type === 'buttons') {
    if (message.buttons.length <= 3) {
      return {
        ...base, type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: message.body },
          action: {
            buttons: message.buttons.map(b => ({
              type: 'reply',
              reply: { id: b.id, title: b.title.slice(0, 20) }
            }))
          }
        }
      };
    }
    // More than 3 buttons  use list
    return buildListPayload(base, message.body, 'Options', [{ title: 'Options', rows: message.buttons.map(b => ({ id: b.id, title: b.title.slice(0, 24) })) }]);
  }

  if (message.type === 'list') {
    return buildListPayload(base, message.body, message.buttonLabel || 'Options', message.sections);
  }

  return null;
}

function buildListPayload(base, body, buttonLabel, sections) {
  return {
    ...base, type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: body },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: sections.map(s => ({
          title: (s.title || 'Options').slice(0, 24),
          rows: s.rows.map(r => ({
            id: r.id,
            title: r.title.slice(0, 24),
            description: r.description ? r.description.slice(0, 72) : undefined,
          }))
        }))
      }
    }
  };
}

//  Get WhatsApp credentials for a business 
function getWACredentials(businessId) {
  const settings = db.prepare('SELECT whatsapp_phone_number_id, whatsapp_access_token FROM settings WHERE business_id = ?').get(businessId);
  if (settings?.whatsapp_access_token) {
    try { settings.whatsapp_access_token = decryptField(settings.whatsapp_access_token); } catch(e) {}
  }
  return settings || null;
}

//  Handle incoming WhatsApp webhook payload 
export async function handleWhatsAppWebhook(body) {
  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) return;

    // Handle message status updates (delivered, read, etc.) - just log
    if (value.statuses) {
      log.info({ statuses: value.statuses }, 'WhatsApp status update');
      return;
    }

    const messages = value.messages;
    if (!messages || messages.length === 0) return;
    // Ignore messages older than 5 minutes (Meta webhook retries)
    const firstMsg = messages[0];
    if (firstMsg?.timestamp) {
      const msgAge = Date.now() / 1000 - parseInt(firstMsg.timestamp);
      if (msgAge > 300) { log.info({ msgAge: Math.round(msgAge) }, 'Ignoring old webhook retry'); return; }
    }

    const wabaId = value.metadata?.phone_number_id;
    if (!wabaId) return;

    // Find which business this phone number belongs to
    const settings = db.prepare('SELECT business_id, whatsapp_access_token, whatsapp_phone_number_id FROM settings WHERE whatsapp_phone_number_id = ?').get(wabaId);
    
    // If not found by phone_number_id, try by WABA ID
    const businessSettings = settings || db.prepare('SELECT business_id, whatsapp_access_token, whatsapp_phone_number_id FROM settings WHERE whatsapp_waba_id = ?').get(entry?.id);
    
    if (!businessSettings) {
      log.warn({ wabaId }, 'No business found for WhatsApp phone_number_id');
      return;
    }

    let { business_id: businessId, whatsapp_access_token: accessToken, whatsapp_phone_number_id: phoneNumberId } = businessSettings;
    try { accessToken = decryptField(accessToken); } catch(e) {}

    for (const msg of messages) {
      const from = msg.from; // customer's phone number
      const msgType = msg.type;

      let input = {};

      if (msgType === 'text') {
        input = { text: msg.text?.body || '' };
      } else if (msgType === 'interactive') {
        const interactive = msg.interactive;
        if (interactive.type === 'button_reply') {
          input = { callbackData: interactive.button_reply.id, text: interactive.button_reply.title };
        } else if (interactive.type === 'list_reply') {
          input = { callbackData: interactive.list_reply.id, text: interactive.list_reply.title };
        }
      } else {
        // Unsupported message type - ignore
        continue;
      }

      // Get customer name from contacts if available
      const contact = value.contacts?.find(c => c.wa_id === from);
      const userName = contact?.profile?.name || from;

      log.info({ businessId, from, input }, 'WhatsApp message received');

      // Process through bot engine
      const responses = processIncoming(businessId, from, 'whatsapp', userName, input);

      // Send responses back
      for (const response of responses) {
        await sendWhatsAppMessage(phoneNumberId, accessToken, from, response);
        // Small delay between messages
        if (responses.length > 1) await new Promise(r => setTimeout(r, 300));
      }
    }
  } catch (err) {
    log.error({ err }, 'WhatsApp webhook handler error');
  }
}
