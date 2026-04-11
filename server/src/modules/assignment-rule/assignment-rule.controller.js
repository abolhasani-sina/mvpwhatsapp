const ruleService = require('./assignment-rule.service');
const assigneeService = require('../assignee/assignee.service');
const { validateCreate, validateUpdate } = require('./assignment-rule.validation');

/**
 * GET /api/v1/assignment-rules
 */
async function listRules(req, res, next) {
  try {
    const rules = await ruleService.list(req.tenantId);
    res.json({ data: rules });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/assignment-rules/:id
 */
async function getRule(req, res, next) {
  try {
    const rule = await ruleService.getById(req.params.id, req.tenantId);
    if (!rule) {
      return res.status(404).json({
        error: { status: 404, message: 'Assignment rule not found' },
      });
    }
    res.json({ data: rule });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/assignment-rules
 */
async function createRule(req, res, next) {
  try {
    const errors = validateCreate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    // Ensure assignee belongs to the same business
    const assignee = await assigneeService.getById(req.body.assignee_id, req.tenantId);
    if (!assignee) {
      return res.status(400).json({
        error: { status: 400, message: 'Assignee not found in this business' },
      });
    }

    const rule = await ruleService.create(req.body, req.tenantId);
    res.status(201).json({ data: rule });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/assignment-rules/:id
 */
async function updateRule(req, res, next) {
  try {
    const existing = await ruleService.getById(req.params.id, req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Assignment rule not found' },
      });
    }

    const errors = validateUpdate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    // If assignee_id is being changed, verify it belongs to this business
    if (req.body.assignee_id) {
      const assignee = await assigneeService.getById(req.body.assignee_id, req.tenantId);
      if (!assignee) {
        return res.status(400).json({
          error: { status: 400, message: 'Assignee not found in this business' },
        });
      }
    }

    const rule = await ruleService.update(req.params.id, req.body, req.tenantId);
    res.json({ data: rule });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/assignment-rules/:id
 */
async function deleteRule(req, res, next) {
  try {
    const deleted = await ruleService.remove(req.params.id, req.tenantId);
    if (!deleted) {
      return res.status(404).json({
        error: { status: 404, message: 'Assignment rule not found' },
      });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listRules, getRule, createRule, updateRule, deleteRule };
