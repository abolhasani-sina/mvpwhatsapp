const db = require('../../config/database');

/**
 * List services for a given tenant (flat list).
 */
async function list(tenantId) {
  return db('services')
    .where({ business_id: tenantId })
    .select('*')
    .orderBy('sort_order', 'asc')
    .orderBy('name', 'asc');
}

/**
 * List services as hierarchy (recursive tree — unlimited depth).
 */
async function listHierarchy(tenantId) {
  const all = await list(tenantId);
  return buildServiceTree(all, null);
}

function buildServiceTree(allServices, parentId) {
  return allServices
    .filter(s => (s.parent_id || null) === parentId)
    .map(s => ({
      ...s,
      children: buildServiceTree(allServices, s.id),
    }));
}

/**
 * Get all leaf services (services with no children — at any depth).
 */
async function getLeafServices(tenantId) {
  const all = await list(tenantId);
  const parentIds = new Set(all.filter(s => s.parent_id).map(s => s.parent_id));
  return all.filter(s => !parentIds.has(s.id));
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
  // Validate parent_id belongs to the same tenant
  if (data.parent_id) {
    const parent = await db('services').where({ id: data.parent_id, business_id: tenantId }).first();
    if (!parent) {
      const err = new Error('Parent service not found or belongs to a different business');
      err.status = 400;
      throw err;
    }
  }

  const [service] = await db('services')
    .insert({
      business_id: tenantId,
      name: data.name,
      description: data.description || null,
      price: data.price != null ? data.price : null,
      duration: data.duration || null,
      parent_id: data.parent_id || null,
      sort_order: data.sort_order != null ? data.sort_order : 0,
      behavior: data.behavior ? JSON.stringify(data.behavior) : null,
      buttons: data.buttons ? JSON.stringify(data.buttons) : null,
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
  if (data.parent_id !== undefined) updateFields.parent_id = data.parent_id || null;
  if (data.sort_order !== undefined) updateFields.sort_order = data.sort_order;
  if (data.behavior !== undefined) updateFields.behavior = data.behavior ? JSON.stringify(data.behavior) : null;
  if (data.buttons !== undefined) updateFields.buttons = data.buttons ? JSON.stringify(data.buttons) : null;

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

/**
 * Get children of a given service node (or root nodes if parentId is null).
 */
async function getChildren(tenantId, parentId) {
  const query = db('services')
    .where({ business_id: tenantId })
    .orderBy('sort_order', 'asc')
    .orderBy('name', 'asc');
  if (parentId) {
    query.andWhere({ parent_id: parentId });
  } else {
    query.andWhereRaw('parent_id IS NULL');
  }
  return query;
}

/**
 * Check if a service node has children (is a category, not a leaf).
 */
async function hasChildren(tenantId, serviceId) {
  const count = await db('services')
    .where({ business_id: tenantId, parent_id: serviceId })
    .count('id as count')
    .first();
  return parseInt(count.count) > 0;
}

module.exports = { list, listHierarchy, getLeafServices, getById, getChildren, hasChildren, create, update, remove };
