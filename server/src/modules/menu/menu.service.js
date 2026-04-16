const db = require('../../config/database');
const { buildTree, getNodeDepth, getSubtreeDepth } = require('./menu.tree');
const { MAX_CHILDREN, MAX_DEPTH, VALID_NODE_TYPES } = require('./menu.validation');

// ---------- Menu Nodes ----------

/**
 * Get all menu nodes for a tenant, returned as a flat array.
 */
async function listFlat(tenantId) {
  return db('menu_nodes')
    .where({ business_id: tenantId })
    .select('*')
    .orderBy('sort_order', 'asc');
}

/**
 * Get the full menu tree for a tenant (nested).
 * Returns navigation-only structure: id, title, type, children.
 * Info contents and action buttons are reserved for future phases.
 */
async function getTree(tenantId) {
  const nodes = await listFlat(tenantId);
  return buildTree(nodes);
}

/**
 * Get a single node by ID, scoped to tenant.
 * Returns the menu_nodes row only. Info content / action buttons
 * are reserved for future phases.
 */
async function getById(id, tenantId) {
  return db('menu_nodes').where({ id, business_id: tenantId }).first();
}

/**
 * Create a new menu node.
 * Validates: max children, max depth, parent existence, leaf-type constraints.
 */
async function create(data, tenantId) {
  // If parent_id is provided, verify parent exists and belongs to tenant
  if (data.parent_id) {
    const parent = await db('menu_nodes')
      .where({ id: data.parent_id, business_id: tenantId })
      .first();
    if (!parent) {
      return { error: 'Parent node not found or does not belong to this business' };
    }

    // Parent must be a menu or catalog_entry node (can have children)
    if (parent.node_type !== 'menu' && parent.node_type !== 'catalog_entry') {
      return { error: 'Only menu and catalog_entry nodes can have children' };
    }

    // Check max children
    const siblingCount = await db('menu_nodes')
      .where({ parent_id: data.parent_id, business_id: tenantId })
      .count('id as count')
      .first();
    if (parseInt(siblingCount.count) >= MAX_CHILDREN) {
      return { error: `Maximum ${MAX_CHILDREN} children per menu node` };
    }

    // Check max depth: parent depth + 1 must not exceed MAX_DEPTH
    const allNodes = await listFlat(tenantId);
    const parentDepth = getNodeDepth(allNodes, data.parent_id);
    if (parentDepth + 1 > MAX_DEPTH) {
      return { error: `Maximum tree depth is ${MAX_DEPTH} levels` };
    }
  }

  const [node] = await db('menu_nodes')
    .insert({
      business_id: tenantId,
      parent_id: data.parent_id || null,
      node_type: data.node_type,
      label: data.label,
      sort_order: data.sort_order != null ? data.sort_order : 0,
      action_type: data.node_type === 'action' ? data.action_type : null,
      action_config: data.node_type === 'action' && data.action_config ? JSON.stringify(data.action_config) : null,
      flow_id: data.node_type === 'flow_entry' ? data.flow_id || null : null,
      catalog_node_id: data.node_type === 'catalog_entry' ? data.catalog_node_id || null : null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    })
    .returning('*');

  return { data: node };
}

/**
 * Update a menu node.
 */
async function update(id, data, tenantId) {
  const existing = await db('menu_nodes').where({ id, business_id: tenantId }).first();
  if (!existing) return null;

  const updateFields = {};
  if (data.label !== undefined) updateFields.label = data.label;
  if (data.node_type !== undefined) updateFields.node_type = data.node_type;
  if (data.sort_order !== undefined) updateFields.sort_order = data.sort_order;
  if (data.is_active !== undefined) updateFields.is_active = data.is_active;

  const effectiveType = data.node_type || existing.node_type;

  if (effectiveType === 'action') {
    if (data.action_type !== undefined) updateFields.action_type = data.action_type;
    if (data.action_config !== undefined) updateFields.action_config = data.action_config ? JSON.stringify(data.action_config) : null;
  } else {
    // Clear action fields if type changed away from action
    if (data.node_type !== undefined && data.node_type !== 'action') {
      updateFields.action_type = null;
      updateFields.action_config = null;
    }
  }

  if (effectiveType === 'flow_entry') {
    if (data.flow_id !== undefined) updateFields.flow_id = data.flow_id;
  } else {
    if (data.node_type !== undefined && data.node_type !== 'flow_entry') {
      updateFields.flow_id = null;
    }
  }

  if (effectiveType === 'catalog_entry') {
    if (data.catalog_node_id !== undefined) updateFields.catalog_node_id = data.catalog_node_id || null;
  } else {
    if (data.node_type !== undefined && data.node_type !== 'catalog_entry') {
      updateFields.catalog_node_id = null;
    }
  }

  // Handle parent change — validate depth
  if (data.parent_id !== undefined && data.parent_id !== existing.parent_id) {
    if (data.parent_id !== null) {
      const newParent = await db('menu_nodes')
        .where({ id: data.parent_id, business_id: tenantId })
        .first();
      if (!newParent) return { error: 'Parent node not found' };
      if (newParent.node_type !== 'menu' && newParent.node_type !== 'catalog_entry') return { error: 'Only menu and catalog_entry nodes can have children' };

      // Prevent moving a node under itself or its descendants
      const allNodes = await listFlat(tenantId);
      if (isDescendant(allNodes, data.parent_id, id)) {
        return { error: 'Cannot move a node under its own subtree' };
      }

      // Check depth: parent depth + subtree depth of moving node + 1 <= MAX_DEPTH
      const newParentDepth = getNodeDepth(allNodes, data.parent_id);
      const subtreeDepth = getSubtreeDepth(allNodes, id);
      if (newParentDepth + 1 + subtreeDepth > MAX_DEPTH) {
        return { error: `Move would exceed maximum tree depth of ${MAX_DEPTH}` };
      }

      // Check max children on new parent
      const siblingCount = await db('menu_nodes')
        .where({ parent_id: data.parent_id, business_id: tenantId })
        .whereNot({ id })
        .count('id as count')
        .first();
      if (parseInt(siblingCount.count) >= MAX_CHILDREN) {
        return { error: `Maximum ${MAX_CHILDREN} children per menu node` };
      }
    }
    updateFields.parent_id = data.parent_id;
  }

  if (Object.keys(updateFields).length === 0) {
    return getById(id, tenantId);
  }

  const [node] = await db('menu_nodes')
    .where({ id, business_id: tenantId })
    .update(updateFields)
    .returning('*');
  return node;
}

/**
 * Delete a menu node and its entire subtree (cascade via FK).
 */
async function remove(id, tenantId) {
  const existing = await db('menu_nodes').where({ id, business_id: tenantId }).first();
  if (!existing) return null;
  await db('menu_nodes').where({ id, business_id: tenantId }).del();
  return existing;
}

/**
 * Reorder a node among its siblings.
 */
async function reorder(id, newSortOrder, tenantId) {
  const existing = await db('menu_nodes').where({ id, business_id: tenantId }).first();
  if (!existing) return null;

  const [node] = await db('menu_nodes')
    .where({ id, business_id: tenantId })
    .update({ sort_order: newSortOrder })
    .returning('*');
  return node;
}

// ---------- Info Contents & Action Buttons ----------
// Reserved for future phases. Tables exist (info_contents, action_buttons)
// but these functions are not used in Phase 3 core menu logic.
// Menu is navigation-only in this phase.

// ---------- Publish Validation ----------

/**
 * Validate the full menu tree for publishing.
 * Returns a violations array. Empty array = valid.
 */
async function validateForPublish(tenantId) {
  const nodes = await listFlat(tenantId);
  const tree = buildTree(nodes);
  const violations = [];

  validateNodeRecursive(tree, 1, violations);

  return violations;
}

function validateNodeRecursive(nodes, depth, violations) {
  for (const node of nodes) {
    // Max depth
    if (depth > MAX_DEPTH) {
      violations.push({
        entity_type: 'menu_node',
        entity_id: node.id,
        rule: 'max_depth',
        current: depth,
        limit: MAX_DEPTH,
      });
    }

    // Menu nodes must have at least 1 child
    if (node.node_type === 'menu' && node.children.length === 0) {
      violations.push({
        entity_type: 'menu_node',
        entity_id: node.id,
        rule: 'min_children',
        current: 0,
        limit: 1,
      });
    }

    // Max children
    if (node.children.length > MAX_CHILDREN) {
      violations.push({
        entity_type: 'menu_node',
        entity_id: node.id,
        rule: 'max_children',
        current: node.children.length,
        limit: MAX_CHILDREN,
      });
    }

    // Info nodes: max action buttons check reserved for future phases
    // (action_buttons table exists but is not populated in Phase 3)

    // Recurse
    if (node.children.length > 0) {
      validateNodeRecursive(node.children, depth + 1, violations);
    }
  }
}

// ---------- Helpers ----------

/**
 * Check if `candidateId` is a descendant of `ancestorId`.
 */
function isDescendant(flatNodes, candidateId, ancestorId) {
  const nodeMap = {};
  for (const n of flatNodes) nodeMap[n.id] = n;

  let current = candidateId;
  while (current) {
    if (current === ancestorId) return true;
    const node = nodeMap[current];
    if (!node) break;
    current = node.parent_id;
  }
  return false;
}

module.exports = {
  getTree,
  getById,
  create,
  update,
  remove,
  reorder,
  validateForPublish,
};
