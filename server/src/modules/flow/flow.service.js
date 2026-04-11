const db = require('../../config/database');

// ==================== Flow CRUD ====================

/**
 * List all flows for a tenant.
 */
async function listFlows(tenantId) {
  return db('flows')
    .where({ business_id: tenantId })
    .select('*')
    .orderBy('created_at', 'desc');
}

/**
 * Get a flow by ID with its steps, scoped to tenant.
 */
async function getFlowById(id, tenantId) {
  const flow = await db('flows').where({ id, business_id: tenantId }).first();
  if (!flow) return null;

  const steps = await db('flow_steps')
    .where({ flow_id: id })
    .select('*')
    .orderBy('step_order', 'asc');

  return { ...flow, steps };
}

/**
 * Get a flow without steps (for existence checks).
 */
async function getFlowOnly(id, tenantId) {
  return db('flows').where({ id, business_id: tenantId }).first();
}

/**
 * Create a new flow.
 */
async function createFlow(data, tenantId) {
  const [flow] = await db('flows')
    .insert({
      business_id: tenantId,
      name: data.name,
      description: data.description || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    })
    .returning('*');
  return flow;
}

/**
 * Update a flow's metadata.
 */
async function updateFlow(id, data, tenantId) {
  const updateFields = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.is_active !== undefined) updateFields.is_active = data.is_active;

  if (Object.keys(updateFields).length === 0) {
    return getFlowOnly(id, tenantId);
  }

  const [flow] = await db('flows')
    .where({ id, business_id: tenantId })
    .update(updateFields)
    .returning('*');
  return flow;
}

/**
 * Delete a flow (cascade deletes flow_steps via FK).
 */
async function removeFlow(id, tenantId) {
  const existing = await getFlowOnly(id, tenantId);
  if (!existing) return null;
  await db('flows').where({ id, business_id: tenantId }).del();
  return existing;
}

// ==================== Flow Steps CRUD ====================

/**
 * List all steps for a flow, ordered by step_order.
 */
async function listSteps(flowId) {
  return db('flow_steps')
    .where({ flow_id: flowId })
    .select('*')
    .orderBy('step_order', 'asc');
}

/**
 * Get a single step by ID within a flow.
 */
async function getStepById(flowId, stepId) {
  return db('flow_steps').where({ id: stepId, flow_id: flowId }).first();
}

/**
 * Create a new step in a flow.
 * If step_order is not provided, appends to end.
 */
async function createStep(flowId, data) {
  let stepOrder = data.step_order;

  if (stepOrder === undefined || stepOrder === null) {
    // Auto-assign next order
    const maxRow = await db('flow_steps')
      .where({ flow_id: flowId })
      .max('step_order as max')
      .first();
    stepOrder = (maxRow.max || 0) + 1;
  } else {
    // Check for duplicate step_order
    const existing = await db('flow_steps')
      .where({ flow_id: flowId, step_order: stepOrder })
      .first();
    if (existing) {
      return { error: `step_order ${stepOrder} already exists in this flow` };
    }
  }

  const [step] = await db('flow_steps')
    .insert({
      flow_id: flowId,
      step_order: stepOrder,
      type: data.type,
      label: data.label,
      config: data.config ? JSON.stringify(data.config) : '{}',
      is_required: data.is_required !== undefined ? data.is_required : true,
    })
    .returning('*');

  return { data: step };
}

/**
 * Update a step.
 */
async function updateStep(flowId, stepId, data) {
  const existing = await getStepById(flowId, stepId);
  if (!existing) return null;

  const updateFields = {};
  if (data.type !== undefined) updateFields.type = data.type;
  if (data.label !== undefined) updateFields.label = data.label;
  if (data.is_required !== undefined) updateFields.is_required = data.is_required;
  if (data.config !== undefined) {
    updateFields.config = data.config ? JSON.stringify(data.config) : '{}';
  }

  if (data.step_order !== undefined && data.step_order !== existing.step_order) {
    // Check for duplicate step_order
    const conflict = await db('flow_steps')
      .where({ flow_id: flowId, step_order: data.step_order })
      .whereNot({ id: stepId })
      .first();
    if (conflict) {
      return { error: `step_order ${data.step_order} already exists in this flow` };
    }
    updateFields.step_order = data.step_order;
  }

  if (Object.keys(updateFields).length === 0) {
    return existing;
  }

  const [step] = await db('flow_steps')
    .where({ id: stepId, flow_id: flowId })
    .update(updateFields)
    .returning('*');
  return step;
}

/**
 * Delete a step from a flow.
 */
async function removeStep(flowId, stepId) {
  const existing = await getStepById(flowId, stepId);
  if (!existing) return null;
  await db('flow_steps').where({ id: stepId, flow_id: flowId }).del();
  return existing;
}

module.exports = {
  listFlows,
  getFlowById,
  getFlowOnly,
  createFlow,
  updateFlow,
  removeFlow,
  listSteps,
  getStepById,
  createStep,
  updateStep,
  removeStep,
};
