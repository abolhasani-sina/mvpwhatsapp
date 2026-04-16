/**
 * Service validation rules.
 */

const VALID_BEHAVIOR_TYPES = ['show_children', 'show_description', 'direct_action', 'custom'];
const VALID_BUTTON_TYPES = ['booking', 'link', 'phone', 'back', 'go_to_node', 'handover'];

function validateCreate(body) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }

  if (body.price !== undefined && body.price !== null) {
    if (typeof body.price !== 'number' || isNaN(body.price)) {
      errors.push('price must be a number');
    } else if (body.price < 0) {
      errors.push('price must not be negative');
    }
  }

  if (body.duration !== undefined && body.duration !== null) {
    if (typeof body.duration !== 'string') {
      errors.push('duration must be a string');
    }
  }

  if (body.sort_order !== undefined && (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order))) {
    errors.push('sort_order must be an integer');
  }

  if (body.behavior !== undefined && body.behavior !== null) {
    if (typeof body.behavior !== 'object') {
      errors.push('behavior must be an object');
    } else if (body.behavior.type && !VALID_BEHAVIOR_TYPES.includes(body.behavior.type)) {
      errors.push(`behavior.type must be one of: ${VALID_BEHAVIOR_TYPES.join(', ')}`);
    }
  }

  if (body.buttons !== undefined && body.buttons !== null) {
    if (!Array.isArray(body.buttons)) {
      errors.push('buttons must be an array');
    } else {
      for (let i = 0; i < body.buttons.length; i++) {
        const btn = body.buttons[i];
        if (!btn.label || typeof btn.label !== 'string') {
          errors.push(`buttons[${i}].label is required and must be a string`);
        }
        if (!btn.type || !VALID_BUTTON_TYPES.includes(btn.type)) {
          errors.push(`buttons[${i}].type must be one of: ${VALID_BUTTON_TYPES.join(', ')}`);
        }
      }
    }
  }

  return errors;
}

function validateUpdate(body) {
  const errors = [];

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
    errors.push('name must be a non-empty string');
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }

  if (body.price !== undefined && body.price !== null) {
    if (typeof body.price !== 'number' || isNaN(body.price)) {
      errors.push('price must be a number');
    } else if (body.price < 0) {
      errors.push('price must not be negative');
    }
  }

  if (body.duration !== undefined && body.duration !== null) {
    if (typeof body.duration !== 'string') {
      errors.push('duration must be a string');
    }
  }

  if (body.sort_order !== undefined && (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order))) {
    errors.push('sort_order must be an integer');
  }

  if (body.behavior !== undefined && body.behavior !== null) {
    if (typeof body.behavior !== 'object') {
      errors.push('behavior must be an object');
    } else if (body.behavior.type && !VALID_BEHAVIOR_TYPES.includes(body.behavior.type)) {
      errors.push(`behavior.type must be one of: ${VALID_BEHAVIOR_TYPES.join(', ')}`);
    }
  }

  if (body.buttons !== undefined && body.buttons !== null) {
    if (!Array.isArray(body.buttons)) {
      errors.push('buttons must be an array');
    } else {
      for (let i = 0; i < body.buttons.length; i++) {
        const btn = body.buttons[i];
        if (!btn.label || typeof btn.label !== 'string') {
          errors.push(`buttons[${i}].label is required and must be a string`);
        }
        if (!btn.type || !VALID_BUTTON_TYPES.includes(btn.type)) {
          errors.push(`buttons[${i}].type must be one of: ${VALID_BUTTON_TYPES.join(', ')}`);
        }
      }
    }
  }

  return errors;
}

module.exports = { validateCreate, validateUpdate, VALID_BEHAVIOR_TYPES, VALID_BUTTON_TYPES };
