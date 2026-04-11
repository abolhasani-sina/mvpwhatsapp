const serviceService = require('./service.service');
const { validateCreate, validateUpdate } = require('./service.validation');

/**
 * GET /api/v1/services
 */
async function listServices(req, res, next) {
  try {
    const services = await serviceService.list(req.tenantId);
    res.json({ data: services });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/services
 */
async function createService(req, res, next) {
  try {
    const errors = validateCreate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const service = await serviceService.create(req.body, req.tenantId);
    res.status(201).json({ data: service });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/services/:id
 */
async function getService(req, res, next) {
  try {
    const service = await serviceService.getById(req.params.id, req.tenantId);
    if (!service) {
      return res.status(404).json({
        error: { status: 404, message: 'Service not found' },
      });
    }
    res.json({ data: service });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/services/:id
 */
async function updateService(req, res, next) {
  try {
    const existing = await serviceService.getById(req.params.id, req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Service not found' },
      });
    }

    const errors = validateUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const service = await serviceService.update(req.params.id, req.body, req.tenantId);
    res.json({ data: service });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/services/:id
 */
async function deleteService(req, res, next) {
  try {
    const existing = await serviceService.getById(req.params.id, req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Service not found' },
      });
    }

    await serviceService.remove(req.params.id, req.tenantId);
    res.json({ data: { message: 'Service deleted' } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listServices, createService, getService, updateService, deleteService };
