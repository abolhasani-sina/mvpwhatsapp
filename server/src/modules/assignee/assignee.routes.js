const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./assignee.controller');

const router = Router();

router.use(authenticate, tenantScope);

router.get('/', controller.listAssignees);
router.post('/', controller.createAssignee);
router.put('/:id', controller.updateAssignee);
router.delete('/:id', controller.deleteAssignee);

module.exports = router;
