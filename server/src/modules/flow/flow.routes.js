const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./flow.controller');

const router = Router();

router.use(authenticate, tenantScope);

// Flow CRUD
router.get('/', controller.listFlows);
router.post('/', controller.createFlow);
router.get('/:id', controller.getFlow);
router.put('/:id', controller.updateFlow);
router.delete('/:id', controller.deleteFlow);

// Flow Steps CRUD
router.get('/:id/steps', controller.listSteps);
router.post('/:id/steps', controller.createStep);
router.put('/:id/steps/:stepId', controller.updateStep);
router.delete('/:id/steps/:stepId', controller.deleteStep);

module.exports = router;
