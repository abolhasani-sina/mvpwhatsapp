const assigneeService = require('./assignee.service');
const { validateCreate, validateUpdate } = require('./assignee.validation');

/**
 * GET /api/v1/assignees
 */
async function listAssignees(req, res, next) {
  try {
    const assignees = await assigneeService.list(req.tenantId);
    res.json({ data: assignees });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/assignees
 */
async function createAssignee(req, res, next) {
  try {
    const errors = validateCreate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const assignee = await assigneeService.create(req.body, req.tenantId);
    res.status(201).json({ data: assignee });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/assignees/:id
 */
async function updateAssignee(req, res, next) {
  try {
    const existing = await assigneeService.getById(req.params.id, req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Assignee not found' },
      });
    }

    const errors = validateUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const assignee = await assigneeService.update(req.params.id, req.body, req.tenantId);
    res.json({ data: assignee });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/assignees/:id
 */
async function deleteAssignee(req, res, next) {
  try {
    const deleted = await assigneeService.remove(req.params.id, req.tenantId);
    if (!deleted) {
      return res.status(404).json({
        error: { status: 404, message: 'Assignee not found' },
      });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listAssignees, createAssignee, updateAssignee, deleteAssignee };
