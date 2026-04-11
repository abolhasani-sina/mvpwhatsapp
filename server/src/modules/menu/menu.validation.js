/**
 * Menu validation rules.
 *
 * Constraints (from roadmap):
 * - max 10 children per menu node
 * - max depth 4 levels
 * - exactly 4 valid node types
 * - action nodes require action_type from fixed enum
 * - info nodes: max 3 action buttons
 */

const VALID_NODE_TYPES = ['menu', 'info', 'flow_entry', 'action'];
const VALID_ACTION_TYPES = ['show_phone', 'show_location', 'open_link', 'go_back'];
const VALID_BUTTON_BEHAVIORS = ['trigger_flow', 'action'];
const MAX_CHILDREN = 10;
const MAX_DEPTH = 4;
const MAX_BUTTONS = 3;

function validateCreateNode(body) {
  const errors = [];

  if (!body.label || typeof body.label !== 'string' || body.label.trim() === '') {
    errors.push('label is required and must be a non-empty string');
  }

  if (!body.node_type || !VALID_NODE_TYPES.includes(body.node_type)) {
    errors.push(`node_type is required and must be one of: ${VALID_NODE_TYPES.join(', ')}`);
  }

  // action nodes must have action_type
  if (body.node_type === 'action') {
    if (!body.action_type || !VALID_ACTION_TYPES.includes(body.action_type)) {
      errors.push(`action_type is required for action nodes and must be one of: ${VALID_ACTION_TYPES.join(', ')}`);
    }
  }

  // action_type only valid on action nodes
  if (body.action_type && body.node_type !== 'action') {
    errors.push('action_type is only valid on action nodes');
  }

  if (body.sort_order !== undefined && (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order))) {
    errors.push('sort_order must be an integer');
  }

  if (body.parent_id !== undefined && body.parent_id !== null && typeof body.parent_id !== 'string') {
    errors.push('parent_id must be a string (UUID) or null');
  }

  return errors;
}

function validateUpdateNode(body) {
  const errors = [];

  if (body.label !== undefined && (typeof body.label !== 'string' || body.label.trim() === '')) {
    errors.push('label must be a non-empty string');
  }

  if (body.node_type !== undefined && !VALID_NODE_TYPES.includes(body.node_type)) {
    errors.push(`node_type must be one of: ${VALID_NODE_TYPES.join(', ')}`);
  }

  if (body.action_type !== undefined && body.action_type !== null && !VALID_ACTION_TYPES.includes(body.action_type)) {
    errors.push(`action_type must be one of: ${VALID_ACTION_TYPES.join(', ')} or null`);
  }

  if (body.sort_order !== undefined && (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order))) {
    errors.push('sort_order must be an integer');
  }

  return errors;
}

function validateReorder(body) {
  const errors = [];

  if (body.sort_order === undefined || typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order)) {
    errors.push('sort_order is required and must be an integer');
  }

  return errors;
}

function validateInfoContent(body) {
  const errors = [];

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }

  if (body.price !== undefined && body.price !== null) {
    if (typeof body.price !== 'number' || isNaN(body.price)) {
      errors.push('price must be a number');
    }
  }

  if (body.duration !== undefined && body.duration !== null) {
    if (typeof body.duration !== 'string') {
      errors.push('duration must be a string');
    }
  }

  return errors;
}

function validateActionButton(body) {
  const errors = [];

  if (!body.label || typeof body.label !== 'string' || body.label.trim() === '') {
    errors.push('label is required and must be a non-empty string');
  }

  if (!body.behavior_type || !VALID_BUTTON_BEHAVIORS.includes(body.behavior_type)) {
    errors.push(`behavior_type is required and must be one of: ${VALID_BUTTON_BEHAVIORS.join(', ')}`);
  }

  if (body.behavior_type === 'action') {
    if (!body.action_type || !VALID_ACTION_TYPES.includes(body.action_type)) {
      errors.push(`action_type is required for action buttons and must be one of: ${VALID_ACTION_TYPES.join(', ')}`);
    }
  }

  if (body.sort_order !== undefined && (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order))) {
    errors.push('sort_order must be an integer');
  }

  return errors;
}

module.exports = {
  validateCreateNode,
  validateUpdateNode,
  validateReorder,
  validateInfoContent,
  validateActionButton,
  VALID_NODE_TYPES,
  VALID_ACTION_TYPES,
  VALID_BUTTON_BEHAVIORS,
  MAX_CHILDREN,
  MAX_DEPTH,
  MAX_BUTTONS,
};
