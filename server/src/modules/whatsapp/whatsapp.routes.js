const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./whatsapp.controller');

const router = Router();

// Meta webhook verification (no auth required)
router.get('/', controller.verifyWebhook);

// Incoming message handler (no auth required — Meta calls this)
router.post('/', controller.handleWebhook);

// Simulate endpoint — authenticated, business_id derived from tenant
router.post('/simulate', authenticate, tenantScope, controller.simulateMessage);

module.exports = router;
