const engine = require('./whatsapp.engine');
const whatsappService = require('./whatsapp.service');
const db = require('../../config/database');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(str) { return UUID_RE.test(str); }

// In-memory deduplication cache for webhook message IDs
const processedMessages = new Set();
const DEDUP_CACHE_MAX = 10000;

/**
 * GET /api/v1/webhook/whatsapp
 * Meta webhook verification (challenge response).
 * Uses WEBHOOK_VERIFY_TOKEN env variable.
 */
async function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode !== 'subscribe' || !token || !challenge) {
    return res.status(400).json({ error: 'Missing verification parameters' });
  }

  const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    return res.status(403).json({ error: 'Invalid verify token' });
  }

  res.status(200).send(challenge);
}

/**
 * POST /api/v1/webhook/whatsapp
 * Incoming message handler from Meta Cloud API.
 * Business resolution will be implemented when connection management is added.
 */
async function handleWebhook(req, res) {
  // Always respond 200 quickly to Meta
  res.status(200).json({ status: 'ok' });

  try {
    const body = req.body;

    // Extract message data from Meta webhook payload
    const entry = body.entry && body.entry[0];
    if (!entry) return;

    const changes = entry.changes && entry.changes[0];
    if (!changes || changes.field !== 'messages') return;

    const value = changes.value;
    if (!value || !value.messages || value.messages.length === 0) return;

    const message = value.messages[0];
    const phoneNumber = message.from;

    // Deduplication: skip already-processed messages
    const messageId = message.id;
    if (messageId && processedMessages.has(messageId)) {
      console.log('[Webhook] Duplicate message ignored:', messageId);
      return;
    }
    if (messageId) {
      processedMessages.add(messageId);
      if (processedMessages.size > DEDUP_CACHE_MAX) {
        const oldest = processedMessages.values().next().value;
        processedMessages.delete(oldest);
      }
    }

    // Extract message content based on type
    const isInteractive = message.type === 'interactive';
    const isText = message.type === 'text';

    let messageText = '';
    if (isInteractive) {
      if (message.interactive.type === 'button_reply') {
        messageText = message.interactive.button_reply.id;
      } else if (message.interactive.type === 'list_reply') {
        messageText = message.interactive.list_reply.id;
      }
    } else if (isText) {
      messageText = message.text && message.text.body;
    }

    if (!phoneNumber || !messageText) return;

    // Business resolution — look up business by phone_number_id
    const phoneNumberId = value.metadata && value.metadata.phone_number_id;

    const account = await db('whatsapp_accounts')
      .where({ phone_number_id: phoneNumberId, is_active: true })
      .first();

    if (!account) {
      console.log('[Webhook] No business found for phone_number_id:', phoneNumberId);
      return;
    }

    const businessId = account.business_id;
    const messageType = isInteractive ? 'interactive' : 'text';
    console.log('[Webhook] Incoming from:', phoneNumber, '| business:', businessId, '| type:', messageType, '| text:', messageText);

    // Delegate ALL logic to engine — controller makes no decisions
    const responseMessages = await engine.handleIncomingMessage(phoneNumber, businessId, messageText, messageType);

    if (responseMessages && responseMessages.length > 0) {
      await whatsappService.sendMessages(null, null, responseMessages);
    }
  } catch (err) {
    console.error('[Webhook] Error processing message:', err);
  }
}

/**
 * POST /api/v1/webhook/whatsapp/simulate
 * Development-only endpoint to simulate incoming messages without Meta.
 * Body: { phone_number, business_id, message }
 */
async function simulateMessage(req, res, next) {
  try {
    const { phone_number, message } = req.body;
    const business_id = req.tenantId;

    if (!phone_number || !message) {
      return res.status(400).json({
        error: { status: 400, message: 'phone_number and message are required' },
      });
    }

    if (!business_id) {
      return res.status(403).json({
        error: { status: 403, message: 'No business associated with this user' },
      });
    }

    const isNumeric = /^\d+$/.test(message);
    const messageType = isNumeric ? 'interactive' : 'text';
    const responseMessages = await engine.handleIncomingMessage(phone_number, business_id, message, messageType);

    // Log mock sends
    for (const msg of responseMessages) {
      console.log('[Simulate] Would send:', JSON.stringify(msg, null, 2));
    }

    res.json({ data: { responses: responseMessages } });
  } catch (err) {
    next(err);
  }
}

module.exports = { verifyWebhook, handleWebhook, simulateMessage };
