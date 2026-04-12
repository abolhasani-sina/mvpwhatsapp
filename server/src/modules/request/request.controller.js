const requestService = require('./request.service');
const assigneeService = require('../assignee/assignee.service');
const notificationService = require('../notification/notification.service');
const { assignRequest } = require('../assignment-rule/assignment.engine');
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

    let request = await requestService.create(req.body, req.tenantId);

    // Notification: request_created
    await notificationService.create({
      businessId: req.tenantId,
      type: 'request_created',
      referenceId: request.id,
      referenceType: 'request',
      message: `New request created (status: pending)`,
    });

    // Rule-based auto-assignment (fire-and-forget, does not affect response on failure)
    const assigned = await assignRequest(request, req.tenantId);
    if (assigned) {
      request = assigned;
      // Notification: request_assigned (auto)
      await notificationService.create({
        businessId: req.tenantId,
        type: 'request_assigned',
        referenceId: request.id,
        referenceType: 'request',
        message: `Request auto-assigned to assignee`,
      });
    }

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

    // Notification: request_status_changed
    await notificationService.create({
      businessId: req.tenantId,
      type: 'request_status_changed',
      referenceId: request.id,
      referenceType: 'request',
      message: `Request status changed from "${existing.status}" to "${newStatus}"`,
    });

    res.json({ data: request });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/requests/:id/assign
 */
async function assignRequestToAssignee(req, res, next) {
  try {
    const existing = await requestService.getById(req.params.id, req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Request not found' },
      });
    }

    const { assignee_id } = req.body;
    if (!assignee_id || typeof assignee_id !== 'string') {
      return res.status(400).json({
        error: { status: 400, message: 'assignee_id is required' },
      });
    }

    // Ensure assignee belongs to the same business
    const assignee = await assigneeService.getById(assignee_id, req.tenantId);
    if (!assignee) {
      return res.status(400).json({
        error: { status: 400, message: 'Assignee not found in this business' },
      });
    }

    const request = await requestService.assign(req.params.id, assignee_id, req.tenantId);

    // Notification: request_assigned (manual)
    await notificationService.create({
      businessId: req.tenantId,
      type: 'request_assigned',
      referenceId: request.id,
      referenceType: 'request',
      message: `Request manually assigned to ${assignee.name}`,
    });

    res.json({ data: request });
  } catch (err) {
    next(err);
  }
}

module.exports = { listRequests, getRequest, createRequest, updateStatus, assignRequestToAssignee };
