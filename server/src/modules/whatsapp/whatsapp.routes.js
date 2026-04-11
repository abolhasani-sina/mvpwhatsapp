const { Router } = require('express');
const controller = require('./whatsapp.controller');

const router = Router();

// Meta webhook verification (no auth required)
router.get('/', controller.verifyWebhook);

// Incoming message handler (no auth required — Meta calls this)
router.post('/', controller.handleWebhook);

// Simulate endpoint for development (no auth required)
router.post('/simulate', controller.simulateMessage);

module.exports = router;
