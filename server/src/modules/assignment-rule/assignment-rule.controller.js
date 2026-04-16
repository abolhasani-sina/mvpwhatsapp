const ruleService = require('./assignment-rule.service');
const assigneeService = require('../assignee/assignee.service');
const { validateCreate, validateUpdate } = require('./assignment-rule.validation');
const db = require('../../config/database');

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

    // Validate trigger_id references an existing entity
    if (req.body.trigger_type && req.body.trigger_id) {
      const refError = await validateTriggerReference(req.body.trigger_type, req.body.trigger_id, req.tenantId);
      if (refError) {
        return res.status(400).json({
          error: { status: 400, message: refError },
        });
      }
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

    // Validate trigger_id references an existing entity
    const triggerType = req.body.trigger_type !== undefined ? req.body.trigger_type : existing.trigger_type;
    const triggerId = req.body.trigger_id !== undefined ? req.body.trigger_id : existing.trigger_id;
    if (triggerType && triggerId) {
      const refError = await validateTriggerReference(triggerType, triggerId, req.tenantId);
      if (refError) {
        return res.status(400).json({
          error: { status: 400, message: refError },
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

/**
 * Validate that trigger_id references an existing entity for the given trigger_type.
 * Returns an error string if invalid, or null if valid.
 */
async function validateTriggerReference(triggerType, triggerId, tenantId) {
  switch (triggerType) {
    case 'service': {
      const service = await db('services').where({ id: triggerId, business_id: tenantId }).first();
      if (!service) return `Service with id '${triggerId}' not found in this business`;
      return null;
    }
    case 'menu_node': {
      const node = await db('menu_nodes').where({ id: triggerId, business_id: tenantId }).first();
      if (!node) return `Menu node with id '${triggerId}' not found in this business`;
      return null;
    }
    case 'flow': {
      const flow = await db('flows').where({ id: triggerId, business_id: tenantId }).first();
      if (!flow) return `Flow with id '${triggerId}' not found in this business`;
      return null;
    }
    default:
      return `Unknown trigger_type '${triggerType}'`;
  }
}

/**
 * PATCH /api/v1/assignment-rules/remap-triggers
 * Remap trigger_id references after a publish cycle regenerates entities.
 */
async function remapTriggers(req, res, next) {
  try {
    const { maps } = req.body;
    if (!maps || typeof maps !== 'object') {
      return res.status(400).json({ error: { status: 400, message: 'maps object is required' } });
    }
    const allowed = ['service', 'flow', 'menu_node'];
    for (const key of Object.keys(maps)) {
      if (!allowed.includes(key)) {
        return res.status(400).json({ error: { status: 400, message: `Invalid trigger type: ${key}` } });
      }
    }
    const updated = await ruleService.remapTriggers(maps, req.tenantId);
    res.json({ data: { updated } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listRules, getRule, createRule, updateRule, deleteRule, remapTriggers };
