const db = require('../../config/database');

/**
 * List services for a given tenant.
 */
async function list(tenantId) {
  return db('services')
    .where({ business_id: tenantId })
    .select('*')
    .orderBy('created_at', 'desc');
}

/**
 * Get a single service by ID, scoped to tenant.
 */
async function getById(id, tenantId) {
  return db('services').where({ id, business_id: tenantId }).first();
}

/**
 * Create a new service, scoped to tenant.
 */
async function create(data, tenantId) {
  const [service] = await db('services')
    .insert({
      business_id: tenantId,
      name: data.name,
      description: data.description || null,
      price: data.price != null ? data.price : null,
      duration: data.duration || null,
    })
    .returning('*');
  return service;
}

/**
 * Update a service by ID, scoped to tenant.
 */
async function update(id, data, tenantId) {
  const updateFields = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.price !== undefined) updateFields.price = data.price;
  if (data.duration !== undefined) updateFields.duration = data.duration;

  if (Object.keys(updateFields).length === 0) {
    return getById(id, tenantId);
  }

  const [service] = await db('services')
    .where({ id, business_id: tenantId })
    .update(updateFields)
    .returning('*');
  return service;
}

/**
 * Delete a service by ID, scoped to tenant.
 */
async function remove(id, tenantId) {
  return db('services').where({ id, business_id: tenantId }).del();
}

module.exports = { list, getById, create, update, remove };
