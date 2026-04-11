/**
 * Assignment rule validation rules.
 * Phase 6 — Assignment System
 */

function validateCreate(body) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (body.priority === undefined || body.priority === null) {
    errors.push('priority is required');
  } else if (!Number.isInteger(body.priority)) {
    errors.push('priority must be an integer');
  }

  if (body.conditions !== undefined && body.conditions !== null) {
    if (typeof body.conditions !== 'object' || Array.isArray(body.conditions)) {
      errors.push('conditions must be a JSON object');
    }
  }

  if (!body.assignee_id || typeof body.assignee_id !== 'string') {
    errors.push('assignee_id is required and must be a string (UUID)');
  }

  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return errors;
}

function validateUpdate(body) {
  const errors = [];

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
    errors.push('name must be a non-empty string');
  }

  if (body.priority !== undefined && !Number.isInteger(body.priority)) {
    errors.push('priority must be an integer');
  }

  if (body.conditions !== undefined && body.conditions !== null) {
    if (typeof body.conditions !== 'object' || Array.isArray(body.conditions)) {
      errors.push('conditions must be a JSON object');
    }
  }

  if (body.assignee_id !== undefined && (typeof body.assignee_id !== 'string' || body.assignee_id.trim() === '')) {
    errors.push('assignee_id must be a string (UUID)');
  }

  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return errors;
}

module.exports = { validateCreate, validateUpdate };
