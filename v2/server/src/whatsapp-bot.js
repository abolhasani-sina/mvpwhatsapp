//  WhatsApp Cloud API Message Handler 
// [ADDED: whatsapp-webhook]
import db from './db.js';
import { decryptField } from './middleware/encryption.js';
import { processIncoming } from './bot-engine.js';
import { handleAISecretary, isAISecretaryActive, getBusinessBrain } from './ai-secretary.js';
import { createLogger } from './logger.js';

const log = createLogger('whatsapp-bot');

//  Message Buffer 
const messageBuffer = new Map();
const BUFFER_TIMEOUT_MS = 8000; // 8 seconds

async function sendReadReceipt(phoneNumberId, accessToken, messageId) {
  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId })
    });
  } catch(e) {}
}

async function processBufferedMessages(bufferKey) {
  const buffered = messageBuffer.get(bufferKey);
  if (!buffered) return;
  messageBuffer.delete(bufferKey);
  const { messages, lastMsgId, meta: { businessId, from, userName, phoneNumberId, accessToken, brain } } = buffered;
  const combinedText = messages.join('\n');
  log.info({ businessId, from, messageCount: messages.length, combinedText }, 'Processing buffered messages');
  await sendReadReceipt(phoneNumberId, accessToken, lastMsgId);
  const aiResponse = await handleAISecretary(businessId, from, userName, combinedText, brain, buffered.imageData);
  await sendWhatsAppMessage(phoneNumberId, accessToken, from, aiResponse);
}
//  End Message Buffer 

// -- Media Handling --
async function downloadWhatsAppMedia(mediaId, accessToken) {
  try {
    const metaRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const meta = await metaRes.json();
    if (!meta.url) return null;
    const fileRes = await fetch(meta.url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const buffer = await fileRes.arrayBuffer();
    return { buffer: Buffer.from(buffer), mimeType: meta.mime_type || 'application/octet-stream' };
  } catch(e) {
    log.error({ err: e.message }, 'Failed to download WhatsApp media');
    return null;
  }
}

async function transcribeAudio(buffer, mimeType) {
  try {
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mpeg') ? 'mp3' : 'ogg';
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, 'audio.' + ext);
    formData.append('model', 'whisper-1');
    formData.append('prompt', 'Beauty salon customer inquiry. Booking appointment, haircut, makeup, nails, massage, facial treatment.');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData
    });
    const data = await res.json();
    return data.text || '';
  } catch(e) {
    log.error({ err: e.message }, 'Failed to transcribe audio');
    return '';
  }
}
// -- End Media Handling --


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
      } else if (msgType === 'image') {
        const caption = msg.image?.caption || '';
        const mediaId = msg.image?.id;
        if (mediaId) {
          const media = await downloadWhatsAppMedia(mediaId, accessToken);
          if (media) {
            const base64 = media.buffer.toString('base64');
            input = { text: caption || 'Customer sent an image', imageBase64: base64, imageMimeType: media.mimeType };
          } else {
            input = { text: caption || 'Customer sent an image' };
          }
        } else {
          input = { text: caption || 'Customer sent an image' };
        }
      } else if (msgType === 'audio' || msgType === 'voice') {
        const mediaId = msg.audio?.id || msg.voice?.id;
        if (mediaId) {
          const media = await downloadWhatsAppMedia(mediaId, accessToken);
          if (media) {
            const transcribed = await transcribeAudio(media.buffer, media.mimeType);
            if (transcribed) {
              input = { text: '[Voice message]: ' + transcribed };
            } else {
              await sendWhatsAppMessage(phoneNumberId, accessToken, from, { type: 'text', body: "Sorry, I could not understand your voice message. Could you please type it?" });
              continue;
            }
          } else {
            await sendWhatsAppMessage(phoneNumberId, accessToken, from, { type: 'text', body: "Sorry, I could not process your voice message. Could you please type it?" });
            continue;
          }
        } else {
          continue;
        }
      } else {
        // Unsupported message type - ignore
        continue;
      }

      // Get customer name from contacts if available
      const contact = value.contacts?.find(c => c.wa_id === from);
      const userName = contact?.profile?.name || from;

      log.info({ businessId, from, input }, 'WhatsApp message received');

      // Route to AI Secretary or Menu Bot
      if (isAISecretaryActive(businessId)) {
        const brain = getBusinessBrain(businessId);
        if (brain) {
          const textInput = input.text || input.callbackData || '';
          // Buffer messages for 8 seconds to combine rapid multi-part messages
          const bufferKey = `${businessId}:${from}`;
          const existing = messageBuffer.get(bufferKey);
          if (existing) {
            clearTimeout(existing.timer);
            existing.messages.push(textInput);
            existing.lastMsgId = msg.id;
          } else {
            messageBuffer.set(bufferKey, {
              messages: [textInput],
              lastMsgId: msg.id,
              imageData: input.imageBase64 ? { base64: input.imageBase64, mimeType: input.imageMimeType } : null,
              meta: { businessId, from, userName, phoneNumberId, accessToken, brain }
            });
          }
          const timer = setTimeout(() => processBufferedMessages(bufferKey), BUFFER_TIMEOUT_MS);
          messageBuffer.get(bufferKey).timer = timer;
        } else {
          const responses = processIncoming(businessId, from, 'whatsapp', userName, input);
          for (const response of responses) {
            await sendWhatsAppMessage(phoneNumberId, accessToken, from, response);
            if (responses.length > 1) await new Promise(r => setTimeout(r, 300));
          }
        }
      } else {
        // Process through menu bot engine
        const responses = processIncoming(businessId, from, 'whatsapp', userName, input);
        for (const response of responses) {
          await sendWhatsAppMessage(phoneNumberId, accessToken, from, response);
          if (responses.length > 1) await new Promise(r => setTimeout(r, 300));
        }
      }
    }
  } catch (err) {
    log.error({ err }, 'WhatsApp webhook handler error');
  }
}
