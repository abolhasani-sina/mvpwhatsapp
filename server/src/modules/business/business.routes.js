const { Router } = require('express');
const controller = require('./business.controller');

const router = Router();

router.get('/', controller.listBusinesses);
router.post('/', controller.createBusiness);
router.get('/:id', controller.getBusiness);
router.put('/:id', controller.updateBusiness);

module.exports = router;
