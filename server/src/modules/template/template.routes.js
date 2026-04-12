const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./template.controller');

const router = Router();

router.get('/', authenticate, controller.listTemplates);
router.get('/status', authenticate, tenantScope, controller.getSetupStatus);
router.post('/skip', authenticate, tenantScope, controller.skipTemplate);
router.post('/:id/apply', authenticate, tenantScope, controller.applyTemplate);

module.exports = router;
