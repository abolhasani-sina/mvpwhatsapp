// ── Tenant Scoping Middleware ──
// Ensures users can only access their own businesses
import db from '../db.js';

// Loads the user's business and attaches to req.businessId
// Requires authenticate middleware to run first (req.userId)
export function tenantScope(req, res, next) {
  const businessIdParam = req.params.id || req.params.businessId;

  if (!businessIdParam) {
    return next(); // no business param, skip (e.g. /business list endpoint)
  }

  const businessId = Number(businessIdParam);
  if (isNaN(businessId)) {
    return res.status(400).json({ error: 'Invalid business ID' });
  }

  const biz = db.prepare(
    'SELECT id, user_id FROM businesses WHERE id = ?'
  ).get(businessId);

  if (!biz) {
    return res.status(404).json({ error: 'Business not found' });
  }

  if (biz.user_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.businessId = businessId;
  next();
}

// For routes that reference child resources (staff/:id, submissions/:id, etc.)
// Verifies the resource belongs to one of the user's businesses
export function tenantScopeResource(tableName, idParam = 'id') {
  return (req, res, next) => {
    const resourceId = Number(req.params[idParam]);
    if (isNaN(resourceId)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    const resource = db.prepare(
      `SELECT ${tableName}.business_id FROM ${tableName} WHERE ${tableName}.id = ?`
    ).get(resourceId);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Verify business belongs to user
    const biz = db.prepare(
      'SELECT id FROM businesses WHERE id = ? AND user_id = ?'
    ).get(resource.business_id, req.userId);

    if (!biz) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.businessId = resource.business_id;
    req.resourceId = resourceId;
    next();
  };
}

// For flow-related routes (/flows/:id/...) where flows belong to a business
export function tenantScopeFlow(req, res, next) {
  const flowId = Number(req.params.id);
  if (isNaN(flowId)) {
    return res.status(400).json({ error: 'Invalid flow ID' });
  }

  const flow = db.prepare(
    'SELECT f.business_id FROM flows f WHERE f.id = ?'
  ).get(flowId);

  if (!flow) {
    return res.status(404).json({ error: 'Flow not found' });
  }

  const biz = db.prepare(
    'SELECT id FROM businesses WHERE id = ? AND user_id = ?'
  ).get(flow.business_id, req.userId);

  if (!biz) {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.businessId = flow.business_id;
  req.flowId = flowId;
  next();
}
