/**
 * Service validation rules.
 */

function validateCreate(body) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
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

function validateUpdate(body) {
  const errors = [];

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
    errors.push('name must be a non-empty string');
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
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

module.exports = { validateCreate, validateUpdate };
