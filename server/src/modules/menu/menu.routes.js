const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./menu.controller');

const router = Router();

router.use(authenticate, tenantScope);

// --- Menu node CRUD (navigation only) ---
router.get('/', controller.getTree);
router.post('/', controller.createNode);
router.post('/publish', controller.publish);
router.get('/:id', controller.getNode);
router.put('/:id', controller.updateNode);
router.delete('/:id', controller.deleteNode);
router.put('/:id/reorder', controller.reorderNode);

// --- Info content & action buttons: reserved for future phases ---
// Tables exist (info_contents, action_buttons) but endpoints are not
// exposed in Phase 3. Menu is navigation-only in this phase.

module.exports = router;
