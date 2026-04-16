const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./assignment-rule.controller');

const router = Router();

router.use(authenticate, tenantScope);

router.get('/', controller.listRules);
router.post('/', controller.createRule);
router.patch('/remap-triggers', controller.remapTriggers);
router.get('/:id', controller.getRule);
router.put('/:id', controller.updateRule);
router.delete('/:id', controller.deleteRule);

module.exports = router;
