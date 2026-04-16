const { Router } = require('express');
const controller = require('./business.controller');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');

const router = Router();

// All business routes require authentication
router.get('/', authenticate, tenantScope, controller.listBusinesses);
router.post('/', authenticate, tenantScope, controller.createBusiness);
router.get('/:id', authenticate, tenantScope, controller.getBusiness);
router.put('/:id', authenticate, tenantScope, controller.updateBusiness);

module.exports = router;
