const { Router } = require('express');
const authenticate = require('../../middleware/authenticate');
const tenantScope = require('../../middleware/tenantScope');
const businessService = require('./business.service');
const { validateUpdate } = require('./business.validation');

const router = Router();

/**
 * GET /api/v1/profile
 * Get the authenticated user's business profile.
 */
router.get('/', authenticate, tenantScope, async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(403).json({
        error: { status: 403, message: 'No business associated with this user' },
      });
    }

    const business = await businessService.getById(req.tenantId);
    if (!business) {
      return res.status(404).json({
        error: { status: 404, message: 'Business not found' },
      });
    }

    res.json({ data: business });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/profile
 * Update the authenticated user's business profile.
 */
router.put('/', authenticate, tenantScope, async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(403).json({
        error: { status: 403, message: 'No business associated with this user' },
      });
    }

    const existing = await businessService.getById(req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Business not found' },
      });
    }

    const errors = validateUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const business = await businessService.update(req.tenantId, req.body);
    res.json({ data: business });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
