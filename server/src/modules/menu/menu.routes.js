const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./menu.controller');

const router = Router();

router.use(authenticate, tenantScope);

// --- Menu node CRUD ---
router.get('/', controller.getTree);
router.post('/', controller.createNode);
router.post('/publish', controller.publish);
router.get('/:id', controller.getNode);
router.put('/:id', controller.updateNode);
router.delete('/:id', controller.deleteNode);
router.put('/:id/reorder', controller.reorderNode);

// --- Info content (per info node) ---
router.get('/:id/info-content', controller.getInfoContent);
router.put('/:id/info-content', controller.upsertInfoContent);

// --- Action buttons (per info node) ---
router.get('/:id/action-buttons', controller.listActionButtons);
router.post('/:id/action-buttons', controller.createActionButton);
router.put('/:id/action-buttons/:buttonId', controller.updateActionButton);
router.delete('/:id/action-buttons/:buttonId', controller.deleteActionButton);

module.exports = router;
