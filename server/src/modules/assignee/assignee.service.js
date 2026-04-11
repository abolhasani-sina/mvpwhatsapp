const db = require('../../config/database');

/**
 * List all assignees for a tenant.
 */
async function list(tenantId) {
  return db('assignees')
    .where({ business_id: tenantId })
    .select('*')
    .orderBy('created_at', 'desc');
}

/**
 * Get a single assignee by ID, scoped to tenant.
 */
async function getById(id, tenantId) {
  return db('assignees').where({ id, business_id: tenantId }).first();
}

/**
 * Create a new assignee.
 */
async function create(data, tenantId) {
  const [assignee] = await db('assignees')
    .insert({
      business_id: tenantId,
      name: data.name.trim(),
      is_active: data.is_active !== undefined ? data.is_active : true,
    })
    .returning('*');
  return assignee;
}

/**
 * Update an assignee.
 */
async function update(id, data, tenantId) {
  const fields = {};
  if (data.name !== undefined) fields.name = data.name.trim();
  if (data.is_active !== undefined) fields.is_active = data.is_active;

  const [assignee] = await db('assignees')
    .where({ id, business_id: tenantId })
    .update(fields)
    .returning('*');
  return assignee;
}

/**
 * Delete an assignee.
 */
async function remove(id, tenantId) {
  const count = await db('assignees')
    .where({ id, business_id: tenantId })
    .del();
  return count > 0;
}

module.exports = { list, getById, create, update, remove };
