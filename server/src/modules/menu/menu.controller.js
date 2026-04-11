const menuService = require('./menu.service');
const {
  validateCreateNode,
  validateUpdateNode,
  validateReorder,
  validateInfoContent,
  validateActionButton,
} = require('./menu.validation');

// ---------- Menu Nodes ----------

/**
 * GET /api/v1/menu-nodes
 * Return the full menu tree (nested) for the tenant.
 */
async function getTree(req, res, next) {
  try {
    const tree = await menuService.getTree(req.tenantId);
    res.json({ data: tree });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/menu-nodes
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
 * GET /api/v1/menu-nodes/:id
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
 * PUT /api/v1/menu-nodes/:id
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
 * DELETE /api/v1/menu-nodes/:id
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
 * PUT /api/v1/menu-nodes/:id/reorder
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
 * POST /api/v1/menu-nodes/publish
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

// ---------- Info Content ----------

/**
 * GET /api/v1/menu-nodes/:id/info-content
 */
async function getInfoContent(req, res, next) {
  try {
    const node = await menuService.getById(req.params.id, req.tenantId);
    if (!node) {
      return res.status(404).json({ error: { status: 404, message: 'Menu node not found' } });
    }
    if (node.node_type !== 'info') {
      return res.status(400).json({ error: { status: 400, message: 'Node is not an info node' } });
    }
    const ic = await menuService.getInfoContent(node.id);
    res.json({ data: ic || null });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/menu-nodes/:id/info-content
 * Create or update info content for an info node.
 */
async function upsertInfoContent(req, res, next) {
  try {
    const node = await menuService.getById(req.params.id, req.tenantId);
    if (!node) {
      return res.status(404).json({ error: { status: 404, message: 'Menu node not found' } });
    }
    if (node.node_type !== 'info') {
      return res.status(400).json({ error: { status: 400, message: 'Node is not an info node' } });
    }

    const errors = validateInfoContent(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: { status: 400, message: 'Validation failed', details: errors } });
    }

    const ic = await menuService.updateInfoContent(node.id, req.body);
    res.json({ data: ic });
  } catch (err) {
    next(err);
  }
}

// ---------- Action Buttons ----------

/**
 * GET /api/v1/menu-nodes/:id/action-buttons
 */
async function listActionButtons(req, res, next) {
  try {
    const node = await menuService.getById(req.params.id, req.tenantId);
    if (!node) {
      return res.status(404).json({ error: { status: 404, message: 'Menu node not found' } });
    }
    if (node.node_type !== 'info') {
      return res.status(400).json({ error: { status: 400, message: 'Node is not an info node' } });
    }
    const buttons = await menuService.listActionButtons(node.id);
    res.json({ data: buttons });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/menu-nodes/:id/action-buttons
 */
async function createActionButton(req, res, next) {
  try {
    const node = await menuService.getById(req.params.id, req.tenantId);
    if (!node) {
      return res.status(404).json({ error: { status: 404, message: 'Menu node not found' } });
    }
    if (node.node_type !== 'info') {
      return res.status(400).json({ error: { status: 400, message: 'Node is not an info node' } });
    }

    const errors = validateActionButton(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: { status: 400, message: 'Validation failed', details: errors } });
    }

    const result = await menuService.createActionButton(node.id, req.body);
    if (result.error) {
      return res.status(400).json({ error: { status: 400, message: result.error } });
    }

    res.status(201).json({ data: result.data });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/menu-nodes/:id/action-buttons/:buttonId
 */
async function updateActionButton(req, res, next) {
  try {
    const node = await menuService.getById(req.params.id, req.tenantId);
    if (!node) {
      return res.status(404).json({ error: { status: 404, message: 'Menu node not found' } });
    }

    const btn = await menuService.updateActionButton(req.params.buttonId, req.body);
    if (!btn) {
      return res.status(404).json({ error: { status: 404, message: 'Action button not found' } });
    }

    res.json({ data: btn });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/menu-nodes/:id/action-buttons/:buttonId
 */
async function deleteActionButton(req, res, next) {
  try {
    const deleted = await menuService.removeActionButton(req.params.buttonId);
    if (!deleted) {
      return res.status(404).json({ error: { status: 404, message: 'Action button not found' } });
    }
    res.json({ data: { message: 'Button deleted', id: deleted.id } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTree,
  createNode,
  getNode,
  updateNode,
  deleteNode,
  reorderNode,
  publish,
  getInfoContent,
  upsertInfoContent,
  listActionButtons,
  createActionButton,
  updateActionButton,
  deleteActionButton,
};
