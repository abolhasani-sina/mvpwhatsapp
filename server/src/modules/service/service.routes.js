const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const controller = require('./service.controller');

const router = Router();

router.use(authenticate, tenantScope);

router.get('/tree', controller.getTree);
router.get('/leaves', controller.getLeaves);
router.get('/', controller.listServices);
router.post('/', controller.createService);
router.get('/:id', controller.getService);
router.put('/:id', controller.updateService);
router.delete('/:id', controller.deleteService);

module.exports = router;
