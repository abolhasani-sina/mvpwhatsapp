const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./request.controller');

const router = Router();

router.use(authenticate, tenantScope);

router.get('/', controller.listRequests);
router.post('/', controller.createRequest);
router.get('/:id', controller.getRequest);
router.patch('/:id/status', controller.updateStatus);
router.post('/:id/assign', controller.assignRequestToAssignee);
router.post('/:id/takeover', controller.takeoverRequest);
router.post('/:id/release', controller.releaseRequest);

module.exports = router;
