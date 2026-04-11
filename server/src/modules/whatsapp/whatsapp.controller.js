const engine = require('./whatsapp.engine');
const whatsappService = require('./whatsapp.service');

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

    // Extract text from different message types
    let messageText = '';
    if (message.type === 'text') {
      messageText = message.text && message.text.body;
    } else if (message.type === 'interactive') {
      if (message.interactive.type === 'button_reply') {
        messageText = message.interactive.button_reply.id;
      } else if (message.interactive.type === 'list_reply') {
        messageText = message.interactive.list_reply.id;
      }
    }

    if (!phoneNumber || !messageText) return;

    // Business resolution placeholder — use WHATSAPP_BUSINESS_ID env for single-business MVP
    const businessId = process.env.WHATSAPP_BUSINESS_ID;
    if (!businessId) {
      console.log('[Webhook] WHATSAPP_BUSINESS_ID not configured');
      return;
    }

    const responseMessages = await engine.handleIncomingMessage(phoneNumber, businessId, messageText);

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
    const { phone_number, business_id, message } = req.body;

    if (!phone_number || !business_id || !message) {
      return res.status(400).json({
        error: { status: 400, message: 'phone_number, business_id, and message are required' },
      });
    }

    const responseMessages = await engine.handleIncomingMessage(phone_number, business_id, message);

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
