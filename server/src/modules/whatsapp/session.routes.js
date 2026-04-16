const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./session.controller');

const router = Router();

router.use(authenticate, tenantScope);

router.get('/', controller.listSessions);
router.post('/publish', controller.publishBot);
router.delete('/reset', controller.resetSessions);
router.put('/:id/takeover', controller.activateTakeover);
router.put('/:id/release', controller.releaseTakeover);

module.exports = router;
