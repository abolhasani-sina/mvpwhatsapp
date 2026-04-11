const db = require('../../config/database');
const { buildTree, getNodeDepth, getSubtreeDepth } = require('./menu.tree');
const { MAX_CHILDREN, MAX_DEPTH, MAX_BUTTONS, VALID_NODE_TYPES } = require('./menu.validation');

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
 * Info nodes include their info_contents and action_buttons.
 */
async function getTree(tenantId) {
  const nodes = await listFlat(tenantId);

  // Fetch info_contents and action_buttons for all info nodes
  const infoNodeIds = nodes.filter((n) => n.node_type === 'info').map((n) => n.id);
  let infoContents = [];
  let actionButtons = [];
  if (infoNodeIds.length > 0) {
    infoContents = await db('info_contents')
      .whereIn('menu_node_id', infoNodeIds)
      .select('*');
    actionButtons = await db('action_buttons')
      .whereIn('menu_node_id', infoNodeIds)
      .orderBy('sort_order', 'asc')
      .select('*');
  }

  // Attach info_content and action_buttons to their nodes
  const infoMap = {};
  for (const ic of infoContents) {
    infoMap[ic.menu_node_id] = ic;
  }
  const buttonMap = {};
  for (const ab of actionButtons) {
    if (!buttonMap[ab.menu_node_id]) buttonMap[ab.menu_node_id] = [];
    buttonMap[ab.menu_node_id].push(ab);
  }

  for (const node of nodes) {
    if (node.node_type === 'info') {
      node.info_content = infoMap[node.id] || null;
      node.action_buttons = buttonMap[node.id] || [];
    }
  }

  return buildTree(nodes);
}

/**
 * Get a single node by ID, scoped to tenant.
 */
async function getById(id, tenantId) {
  const node = await db('menu_nodes').where({ id, business_id: tenantId }).first();
  if (!node) return null;

  // Attach info_content + action_buttons for info nodes
  if (node.node_type === 'info') {
    node.info_content = await db('info_contents').where({ menu_node_id: id }).first() || null;
    node.action_buttons = await db('action_buttons')
      .where({ menu_node_id: id })
      .orderBy('sort_order', 'asc')
      .select('*');
  }

  return node;
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

    // Parent must be a menu node (only menu nodes can have children)
    if (parent.node_type !== 'menu') {
      return { error: 'Only menu nodes can have children' };
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
      is_active: data.is_active !== undefined ? data.is_active : true,
    })
    .returning('*');

  // If info node, create info_content record if provided
  if (data.node_type === 'info' && data.info_content) {
    const ic = await createInfoContent(node.id, data.info_content);
    node.info_content = ic;
  }

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

  // Handle parent change — validate depth
  if (data.parent_id !== undefined && data.parent_id !== existing.parent_id) {
    if (data.parent_id !== null) {
      const newParent = await db('menu_nodes')
        .where({ id: data.parent_id, business_id: tenantId })
        .first();
      if (!newParent) return { error: 'Parent node not found' };
      if (newParent.node_type !== 'menu') return { error: 'Only menu nodes can have children' };

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

// ---------- Info Contents ----------

async function getInfoContent(nodeId) {
  return db('info_contents').where({ menu_node_id: nodeId }).first();
}

async function createInfoContent(nodeId, data) {
  const [ic] = await db('info_contents')
    .insert({
      menu_node_id: nodeId,
      title: data.title,
      description: data.description || null,
      price: data.price != null ? data.price : null,
      duration: data.duration || null,
    })
    .returning('*');
  return ic;
}

async function updateInfoContent(nodeId, data) {
  const existing = await db('info_contents').where({ menu_node_id: nodeId }).first();

  if (!existing) {
    // Create if doesn't exist
    return createInfoContent(nodeId, data);
  }

  const updateFields = {};
  if (data.title !== undefined) updateFields.title = data.title;
  if (data.description !== undefined) updateFields.description = data.description;
  if (data.price !== undefined) updateFields.price = data.price;
  if (data.duration !== undefined) updateFields.duration = data.duration;

  if (Object.keys(updateFields).length === 0) return existing;

  const [ic] = await db('info_contents')
    .where({ menu_node_id: nodeId })
    .update(updateFields)
    .returning('*');
  return ic;
}

// ---------- Action Buttons ----------

async function listActionButtons(nodeId) {
  return db('action_buttons')
    .where({ menu_node_id: nodeId })
    .orderBy('sort_order', 'asc')
    .select('*');
}

async function createActionButton(nodeId, data) {
  // Check max buttons
  const count = await db('action_buttons')
    .where({ menu_node_id: nodeId })
    .count('id as count')
    .first();
  if (parseInt(count.count) >= MAX_BUTTONS) {
    return { error: `Maximum ${MAX_BUTTONS} action buttons per info node` };
  }

  const [btn] = await db('action_buttons')
    .insert({
      menu_node_id: nodeId,
      label: data.label,
      behavior_type: data.behavior_type,
      flow_id: data.behavior_type === 'trigger_flow' ? data.flow_id || null : null,
      action_type: data.behavior_type === 'action' ? data.action_type || null : null,
      action_config: data.behavior_type === 'action' && data.action_config
        ? JSON.stringify(data.action_config) : null,
      sort_order: data.sort_order != null ? data.sort_order : 0,
    })
    .returning('*');
  return { data: btn };
}

async function updateActionButton(buttonId, data) {
  const updateFields = {};
  if (data.label !== undefined) updateFields.label = data.label;
  if (data.behavior_type !== undefined) updateFields.behavior_type = data.behavior_type;
  if (data.flow_id !== undefined) updateFields.flow_id = data.flow_id;
  if (data.action_type !== undefined) updateFields.action_type = data.action_type;
  if (data.action_config !== undefined) updateFields.action_config = data.action_config ? JSON.stringify(data.action_config) : null;
  if (data.sort_order !== undefined) updateFields.sort_order = data.sort_order;

  if (Object.keys(updateFields).length === 0) {
    return db('action_buttons').where({ id: buttonId }).first();
  }

  const [btn] = await db('action_buttons')
    .where({ id: buttonId })
    .update(updateFields)
    .returning('*');
  return btn;
}

async function removeActionButton(buttonId) {
  const btn = await db('action_buttons').where({ id: buttonId }).first();
  if (!btn) return null;
  await db('action_buttons').where({ id: buttonId }).del();
  return btn;
}

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

    // Info nodes: check max action buttons
    if (node.node_type === 'info' && node.action_buttons && node.action_buttons.length > MAX_BUTTONS) {
      violations.push({
        entity_type: 'menu_node',
        entity_id: node.id,
        rule: 'max_buttons',
        current: node.action_buttons.length,
        limit: MAX_BUTTONS,
      });
    }

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
  getInfoContent,
  createInfoContent,
  updateInfoContent,
  listActionButtons,
  createActionButton,
  updateActionButton,
  removeActionButton,
  validateForPublish,
};
