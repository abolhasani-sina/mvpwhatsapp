/**
 * Flow validation rules.
 * Phase 4 — Linear Data Collection Definition
 */

const VALID_STEP_TYPES = [
  'text_input',
  'number_input',
  'select_option',
  'select_service',
  'confirm',
];

// ---------- Flow Validation ----------

function validateCreateFlow(body) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }

  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return errors;
}

function validateUpdateFlow(body) {
  const errors = [];

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
    errors.push('name must be a non-empty string');
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }

  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return errors;
}

// ---------- Step Validation ----------

function validateCreateStep(body) {
  const errors = [];

  if (!body.type || !VALID_STEP_TYPES.includes(body.type)) {
    errors.push(`type is required and must be one of: ${VALID_STEP_TYPES.join(', ')}`);
  }

  if (!body.label || typeof body.label !== 'string' || body.label.trim() === '') {
    errors.push('label is required and must be a non-empty string');
  }

  if (body.step_order !== undefined && (typeof body.step_order !== 'number' || !Number.isInteger(body.step_order) || body.step_order < 1)) {
    errors.push('step_order must be a positive integer');
  }

  if (body.config !== undefined && body.config !== null) {
    if (typeof body.config !== 'object' || Array.isArray(body.config)) {
      errors.push('config must be a JSON object');
    }
  }

  if (body.is_required !== undefined && typeof body.is_required !== 'boolean') {
    errors.push('is_required must be a boolean');
  }

  return errors;
}

function validateUpdateStep(body) {
  const errors = [];

  if (body.type !== undefined && !VALID_STEP_TYPES.includes(body.type)) {
    errors.push(`type must be one of: ${VALID_STEP_TYPES.join(', ')}`);
  }

  if (body.label !== undefined && (typeof body.label !== 'string' || body.label.trim() === '')) {
    errors.push('label must be a non-empty string');
  }

  if (body.step_order !== undefined && (typeof body.step_order !== 'number' || !Number.isInteger(body.step_order) || body.step_order < 1)) {
    errors.push('step_order must be a positive integer');
  }

  if (body.config !== undefined && body.config !== null) {
    if (typeof body.config !== 'object' || Array.isArray(body.config)) {
      errors.push('config must be a JSON object');
    }
  }

  if (body.is_required !== undefined && typeof body.is_required !== 'boolean') {
    errors.push('is_required must be a boolean');
  }

  return errors;
}

/**
 * Validate flow integrity (at save / publish time):
 * - at least 1 step
 * - no gaps in step_order (sequential 1,2,3...)
 * - no duplicate step_order
 * - last step must be 'confirm'
 */
function validateFlowIntegrity(steps) {
  const errors = [];

  if (!steps || steps.length === 0) {
    errors.push('Flow must have at least 1 step');
    return errors;
  }

  // Sort by step_order
  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);

  // Check for duplicate step_order
  const orders = sorted.map((s) => s.step_order);
  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== orders.length) {
    errors.push('Duplicate step_order values found');
  }

  // Check sequential from 1 with no gaps
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].step_order !== i + 1) {
      errors.push(`step_order must be sequential starting from 1 (expected ${i + 1}, got ${sorted[i].step_order})`);
      break;
    }
  }

  // Last step must be confirm
  const lastStep = sorted[sorted.length - 1];
  if (lastStep.type !== 'confirm') {
    errors.push('Last step must be of type "confirm"');
  }

  return errors;
}

module.exports = {
  VALID_STEP_TYPES,
  validateCreateFlow,
  validateUpdateFlow,
  validateCreateStep,
  validateUpdateStep,
  validateFlowIntegrity,
};
