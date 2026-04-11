const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./notification.controller');

const router = Router();

router.use(authenticate, tenantScope);

router.get('/', controller.listNotifications);
router.get('/unread', controller.listUnread);
router.patch('/:id/read', controller.markAsRead);

module.exports = router;
