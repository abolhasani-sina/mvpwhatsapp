const db = require('../../config/database');

/**
 * List requests for a tenant, optionally filtered by status.
 */
async function list(tenantId, filters = {}) {
  const query = db('requests')
    .where({ business_id: tenantId })
    .select('*')
    .orderBy('created_at', 'desc');

  if (filters.status) {
    query.andWhere({ status: filters.status });
  }

  return query;
}

/**
 * Get a single request by ID, scoped to tenant.
 */
async function getById(id, tenantId) {
  return db('requests').where({ id, business_id: tenantId }).first();
}

/**
 * Create a new request. Status defaults to 'pending'.
 */
async function create(data, tenantId) {
  const [request] = await db('requests')
    .insert({
      business_id: tenantId,
      source_flow_id: data.source_flow_id || null,
      entered_from_node_id: data.entered_from_node_id || null,
      phone_number: data.phone_number || null,
      data: data.data ? JSON.stringify(data.data) : '{}',
      status: 'pending',
    })
    .returning('*');
  return request;
}

/**
 * Update the status of a request.
 */
async function updateStatus(id, newStatus, tenantId) {
  const [request] = await db('requests')
    .where({ id, business_id: tenantId })
    .update({ status: newStatus, updated_at: db.fn.now() })
    .returning('*');
  return request;
}

/**
 * Manually assign a request to an assignee.
 */
async function assign(id, assigneeId, tenantId) {
  const [request] = await db('requests')
    .where({ id, business_id: tenantId })
    .update({
      assigned_to_id: assigneeId,
      assignment_rule_id: null,
      assigned_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');
  return request;
}

module.exports = { list, getById, create, updateStatus, assign };
