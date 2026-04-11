/**
 * Request validation rules.
 * Phase 5 — Request System
 */

const VALID_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'manual_followup',
  'completed',
];

const ALLOWED_TRANSITIONS = {
  pending: ['approved', 'rejected', 'manual_followup'],
  approved: ['completed'],
  rejected: [],
  manual_followup: ['approved', 'rejected', 'completed'],
  completed: [],
};

function validateCreateRequest(body) {
  const errors = [];

  if (body.data !== undefined && body.data !== null) {
    if (typeof body.data !== 'object' || Array.isArray(body.data)) {
      errors.push('data must be a JSON object');
    }
  }

  if (body.source_flow_id !== undefined && body.source_flow_id !== null && typeof body.source_flow_id !== 'string') {
    errors.push('source_flow_id must be a string (UUID) or null');
  }

  if (body.entered_from_node_id !== undefined && body.entered_from_node_id !== null && typeof body.entered_from_node_id !== 'string') {
    errors.push('entered_from_node_id must be a string (UUID) or null');
  }

  return errors;
}

function validateStatusTransition(currentStatus, newStatus) {
  if (!VALID_STATUSES.includes(newStatus)) {
    return `Invalid status "${newStatus}". Must be one of: ${VALID_STATUSES.join(', ')}`;
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    return `Transition from "${currentStatus}" to "${newStatus}" is not allowed`;
  }

  return null;
}

module.exports = {
  VALID_STATUSES,
  ALLOWED_TRANSITIONS,
  validateCreateRequest,
  validateStatusTransition,
};
