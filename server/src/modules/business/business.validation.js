/**
 * Business validation rules.
 * Validates request bodies for create and update operations.
 */

function validateCreate(body) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (!body.phone || typeof body.phone !== 'string' || body.phone.trim() === '') {
    errors.push('phone is required and must be a non-empty string');
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }

  if (body.location !== undefined && typeof body.location !== 'string') {
    errors.push('location must be a string');
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

  if (body.phone !== undefined && (typeof body.phone !== 'string' || body.phone.trim() === '')) {
    errors.push('phone must be a non-empty string');
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }

  if (body.location !== undefined && typeof body.location !== 'string') {
    errors.push('location must be a string');
  }

  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return errors;
}

module.exports = { validateCreate, validateUpdate };
