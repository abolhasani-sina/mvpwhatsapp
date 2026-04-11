const businessService = require('./business.service');
const { validateCreate, validateUpdate } = require('./business.validation');

/**
 * GET /api/v1/businesses
 * List all businesses.
 * Phase 1: No auth — returns all. Phase 2+ will restrict to platform_owner.
 */
async function listBusinesses(req, res, next) {
  try {
    const businesses = await businessService.list();
    res.json({ data: businesses });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/businesses
 * Create a new business.
 */
async function createBusiness(req, res, next) {
  try {
    const errors = validateCreate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: { status: 400, message: 'Validation failed', details: errors } });
    }

    const business = await businessService.create(req.body);
    res.status(201).json({ data: business });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/businesses/:id
 * Get a single business by ID.
 */
async function getBusiness(req, res, next) {
  try {
    const business = await businessService.getById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: { status: 404, message: 'Business not found' } });
    }
    res.json({ data: business });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/businesses/:id
 * Update an existing business.
 */
async function updateBusiness(req, res, next) {
  try {
    const existing = await businessService.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: { status: 404, message: 'Business not found' } });
    }

    const errors = validateUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: { status: 400, message: 'Validation failed', details: errors } });
    }

    const business = await businessService.update(req.params.id, req.body);
    res.json({ data: business });
  } catch (err) {
    next(err);
  }
}

module.exports = { listBusinesses, createBusiness, getBusiness, updateBusiness };
