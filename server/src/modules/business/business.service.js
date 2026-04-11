const db = require('../../config/database');

/**
 * List all businesses.
 * In future phases, platform_owner sees all; business_owner sees own.
 * For Phase 1 (no auth): returns all businesses.
 */
async function list() {
  return db('businesses').select('*').orderBy('created_at', 'desc');
}

/**
 * Get a single business by ID.
 */
async function getById(id) {
  return db('businesses').where({ id }).first();
}

/**
 * Create a new business.
 */
async function create(data) {
  const [business] = await db('businesses')
    .insert({
      name: data.name,
      phone: data.phone,
      location: data.location || null,
      description: data.description || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    })
    .returning('*');
  return business;
}

/**
 * Update an existing business by ID.
 * Only updates provided fields.
 */
async function update(id, data) {
  const updateFields = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.phone !== undefined) updateFields.phone = data.phone;
  if (data.location !== undefined) updateFields.location = data.location;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.is_active !== undefined) updateFields.is_active = data.is_active;

  if (Object.keys(updateFields).length === 0) {
    return getById(id);
  }

  const [business] = await db('businesses')
    .where({ id })
    .update(updateFields)
    .returning('*');
  return business;
}

module.exports = { list, getById, create, update };
