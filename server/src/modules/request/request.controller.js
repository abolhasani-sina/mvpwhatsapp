const requestService = require('./request.service');
const {
  VALID_STATUSES,
  validateCreateRequest,
  validateStatusTransition,
} = require('./request.validation');

/**
 * GET /api/v1/requests
 */
async function listRequests(req, res, next) {
  try {
    const filters = {};
    if (req.query.status) {
      if (!VALID_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          error: { status: 400, message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}` },
        });
      }
      filters.status = req.query.status;
    }

    const requests = await requestService.list(req.tenantId, filters);
    res.json({ data: requests });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/requests/:id
 */
async function getRequest(req, res, next) {
  try {
    const request = await requestService.getById(req.params.id, req.tenantId);
    if (!request) {
      return res.status(404).json({
        error: { status: 404, message: 'Request not found' },
      });
    }
    res.json({ data: request });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/requests
 */
async function createRequest(req, res, next) {
  try {
    const errors = validateCreateRequest(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const request = await requestService.create(req.body, req.tenantId);
    res.status(201).json({ data: request });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/requests/:id/status
 */
async function updateStatus(req, res, next) {
  try {
    const existing = await requestService.getById(req.params.id, req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Request not found' },
      });
    }

    const { status: newStatus } = req.body;
    if (!newStatus) {
      return res.status(400).json({
        error: { status: 400, message: 'status is required' },
      });
    }

    const transitionError = validateStatusTransition(existing.status, newStatus);
    if (transitionError) {
      return res.status(400).json({
        error: { status: 400, message: transitionError },
      });
    }

    const request = await requestService.updateStatus(req.params.id, newStatus, req.tenantId);
    res.json({ data: request });
  } catch (err) {
    next(err);
  }
}

module.exports = { listRequests, getRequest, createRequest, updateStatus };
