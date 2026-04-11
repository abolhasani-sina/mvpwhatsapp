const flowService = require('./flow.service');
const {
  validateCreateFlow,
  validateUpdateFlow,
  validateCreateStep,
  validateUpdateStep,
  validateFlowIntegrity,
} = require('./flow.validation');

// ==================== Flow Endpoints ====================

/**
 * GET /api/v1/flows
 */
async function listFlows(req, res, next) {
  try {
    const flows = await flowService.listFlows(req.tenantId);
    res.json({ data: flows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/flows
 */
async function createFlow(req, res, next) {
  try {
    const errors = validateCreateFlow(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const flow = await flowService.createFlow(req.body, req.tenantId);
    res.status(201).json({ data: flow });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/flows/:id
 */
async function getFlow(req, res, next) {
  try {
    const flow = await flowService.getFlowById(req.params.id, req.tenantId);
    if (!flow) {
      return res.status(404).json({
        error: { status: 404, message: 'Flow not found' },
      });
    }

    // Validate flow integrity and include status
    const integrityErrors = validateFlowIntegrity(flow.steps);

    res.json({ data: flow, valid: integrityErrors.length === 0, integrity_errors: integrityErrors });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/flows/:id
 */
async function updateFlow(req, res, next) {
  try {
    const existing = await flowService.getFlowOnly(req.params.id, req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Flow not found' },
      });
    }

    const errors = validateUpdateFlow(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const flow = await flowService.updateFlow(req.params.id, req.body, req.tenantId);
    res.json({ data: flow });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/flows/:id
 */
async function deleteFlow(req, res, next) {
  try {
    const existing = await flowService.getFlowOnly(req.params.id, req.tenantId);
    if (!existing) {
      return res.status(404).json({
        error: { status: 404, message: 'Flow not found' },
      });
    }

    await flowService.removeFlow(req.params.id, req.tenantId);
    res.json({ data: { message: 'Flow deleted' } });
  } catch (err) {
    next(err);
  }
}

// ==================== Flow Step Endpoints ====================

/**
 * GET /api/v1/flows/:id/steps
 */
async function listSteps(req, res, next) {
  try {
    const flow = await flowService.getFlowOnly(req.params.id, req.tenantId);
    if (!flow) {
      return res.status(404).json({
        error: { status: 404, message: 'Flow not found' },
      });
    }

    const steps = await flowService.listSteps(req.params.id);
    res.json({ data: steps });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/flows/:id/steps
 */
async function createStep(req, res, next) {
  try {
    const flow = await flowService.getFlowOnly(req.params.id, req.tenantId);
    if (!flow) {
      return res.status(404).json({
        error: { status: 404, message: 'Flow not found' },
      });
    }

    const errors = validateCreateStep(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const result = await flowService.createStep(req.params.id, req.body);
    if (result.error) {
      return res.status(400).json({
        error: { status: 400, message: result.error },
      });
    }

    res.status(201).json({ data: result.data });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/flows/:id/steps/:stepId
 */
async function updateStep(req, res, next) {
  try {
    const flow = await flowService.getFlowOnly(req.params.id, req.tenantId);
    if (!flow) {
      return res.status(404).json({
        error: { status: 404, message: 'Flow not found' },
      });
    }

    const errors = validateUpdateStep(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const result = await flowService.updateStep(req.params.id, req.params.stepId, req.body);
    if (!result) {
      return res.status(404).json({
        error: { status: 404, message: 'Step not found' },
      });
    }
    if (result.error) {
      return res.status(400).json({
        error: { status: 400, message: result.error },
      });
    }

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/flows/:id/steps/:stepId
 */
async function deleteStep(req, res, next) {
  try {
    const flow = await flowService.getFlowOnly(req.params.id, req.tenantId);
    if (!flow) {
      return res.status(404).json({
        error: { status: 404, message: 'Flow not found' },
      });
    }

    const result = await flowService.removeStep(req.params.id, req.params.stepId);
    if (!result) {
      return res.status(404).json({
        error: { status: 404, message: 'Step not found' },
      });
    }

    res.json({ data: { message: 'Step deleted' } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listFlows,
  createFlow,
  getFlow,
  updateFlow,
  deleteFlow,
  listSteps,
  createStep,
  updateStep,
  deleteStep,
};
