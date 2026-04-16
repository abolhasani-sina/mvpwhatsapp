const menuService = require('./menu.service');
const {
  validateCreateNode,
  validateUpdateNode,
  validateReorder,
} = require('./menu.validation');

// ---------- Menu Nodes ----------

/**
 * GET /api/v1/menu
 * Return the full menu tree (nested, navigation-only) for the tenant.
 * Response shape: { data: [{ id, title, type, children }] }
 */
async function getTree(req, res, next) {
  try {
    const tree = await menuService.getTree(req.tenantId);
    res.json({ data: formatTree(tree) });
  } catch (err) {
    next(err);
  }
}

/**
 * Strip a tree down to navigation-only fields: id, title, type, children.
 */
function formatTree(nodes) {
  return nodes.map((node) => ({
    id: node.id,
    title: node.label,
    type: node.node_type,
    flow_id: node.flow_id || null,
    action_type: node.action_type || null,
    action_config: node.action_config || null,
    catalog_node_id: node.catalog_node_id || null,
    children: node.children ? formatTree(node.children) : [],
  }));
}

/**
 * POST /api/v1/menu
 * Create a new menu node.
 */
async function createNode(req, res, next) {
  try {
    const errors = validateCreateNode(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const result = await menuService.create(req.body, req.tenantId);
    if (result.error) {
      return res.status(400).json({
        error: { status: 400, message: result.error },
      });
    }

    res.status(201).json({ data: result.data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/menu/:id
 * Get a single node by ID.
 */
async function getNode(req, res, next) {
  try {
    const node = await menuService.getById(req.params.id, req.tenantId);
    if (!node) {
      return res.status(404).json({
        error: { status: 404, message: 'Menu node not found' },
      });
    }
    res.json({ data: node });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/menu/:id
 * Update a menu node.
 */
async function updateNode(req, res, next) {
  try {
    const errors = validateUpdateNode(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const result = await menuService.update(req.params.id, req.body, req.tenantId);
    if (result === null) {
      return res.status(404).json({
        error: { status: 404, message: 'Menu node not found' },
      });
    }
    if (result.error) {
      return res.status(400).json({
        error: { status: 400, message: result.error },
      });
    }

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/menu/:id
 * Delete a node and its entire subtree.
 */
async function deleteNode(req, res, next) {
  try {
    const deleted = await menuService.remove(req.params.id, req.tenantId);
    if (!deleted) {
      return res.status(404).json({
        error: { status: 404, message: 'Menu node not found' },
      });
    }
    res.json({ data: { message: 'Node deleted', id: deleted.id } });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/menu/:id/reorder
 * Set the sort_order for a node among its siblings.
 */
async function reorderNode(req, res, next) {
  try {
    const errors = validateReorder(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { status: 400, message: 'Validation failed', details: errors },
      });
    }

    const node = await menuService.reorder(req.params.id, req.body.sort_order, req.tenantId);
    if (!node) {
      return res.status(404).json({
        error: { status: 404, message: 'Menu node not found' },
      });
    }

    res.json({ data: node });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/menu/publish
 * Validate the full menu tree. Return violations or success.
 */
async function publish(req, res, next) {
  try {
    const violations = await menuService.validateForPublish(req.tenantId);
    if (violations.length > 0) {
      return res.status(400).json({ success: false, violations });
    }
    res.json({ success: true, message: 'Menu tree is valid and published' });
  } catch (err) {
    next(err);
  }
}

// ---------- Info Content & Action Buttons ----------
// Reserved for future phases. Tables exist (info_contents, action_buttons)
// but these handlers are not routed in Phase 3.
// Menu is navigation-only in this phase.

module.exports = {
  getTree,
  createNode,
  getNode,
  updateNode,
  deleteNode,
  reorderNode,
  publish,
};
