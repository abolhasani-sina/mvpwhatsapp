const db = require('../../config/database');

/**
 * List all assignment rules for a tenant.
 */
async function list(tenantId) {
  return db('assignment_rules')
    .where({ 'assignment_rules.business_id': tenantId })
    .leftJoin('assignees', 'assignment_rules.assignee_id', 'assignees.id')
    .select(
      'assignment_rules.*',
      'assignees.name as assignee_name',
      'assignees.is_active as assignee_is_active'
    )
    .orderBy('assignment_rules.priority', 'desc');
}

/**
 * Get a single assignment rule by ID, scoped to tenant.
 */
async function getById(id, tenantId) {
  return db('assignment_rules')
    .where({ 'assignment_rules.id': id, 'assignment_rules.business_id': tenantId })
    .leftJoin('assignees', 'assignment_rules.assignee_id', 'assignees.id')
    .select(
      'assignment_rules.*',
      'assignees.name as assignee_name',
      'assignees.is_active as assignee_is_active'
    )
    .first();
}

/**
 * Create a new assignment rule.
 */
async function create(data, tenantId) {
  const [rule] = await db('assignment_rules')
    .insert({
      business_id: tenantId,
      name: data.name.trim(),
      priority: data.priority,
      conditions: data.conditions ? JSON.stringify(data.conditions) : '{}',
      trigger_type: data.trigger_type || null,
      trigger_id: data.trigger_id || null,
      assignee_id: data.assignee_id,
      is_active: data.is_active !== undefined ? data.is_active : true,
    })
    .returning('*');
  return rule;
}

/**
 * Update an assignment rule.
 */
async function update(id, data, tenantId) {
  const fields = {};
  if (data.name !== undefined) fields.name = data.name.trim();
  if (data.priority !== undefined) fields.priority = data.priority;
  if (data.conditions !== undefined) fields.conditions = JSON.stringify(data.conditions);
  if (data.trigger_type !== undefined) fields.trigger_type = data.trigger_type;
  if (data.trigger_id !== undefined) fields.trigger_id = data.trigger_id;
  if (data.assignee_id !== undefined) fields.assignee_id = data.assignee_id;
  if (data.is_active !== undefined) fields.is_active = data.is_active;

  const [rule] = await db('assignment_rules')
    .where({ id, business_id: tenantId })
    .update(fields)
    .returning('*');
  return rule;
}

/**
 * Delete an assignment rule.
 */
async function remove(id, tenantId) {
  const count = await db('assignment_rules')
    .where({ id, business_id: tenantId })
    .del();
  return count > 0;
}

/**
 * Remap trigger_id references after a publish cycle regenerates entities with new IDs.
 * maps: { service: { oldId: newId }, flow: { oldId: newId }, menu_node: { oldId: newId } }
 */
async function remapTriggers(maps, tenantId) {
  let updated = 0;
  for (const [triggerType, idMap] of Object.entries(maps)) {
    for (const [oldId, newId] of Object.entries(idMap)) {
      const count = await db('assignment_rules')
        .where({ business_id: tenantId, trigger_type: triggerType, trigger_id: Number(oldId) })
        .update({ trigger_id: Number(newId) });
      updated += count;
    }
  }
  return updated;
}

module.exports = { list, getById, create, update, remove, remapTriggers };
