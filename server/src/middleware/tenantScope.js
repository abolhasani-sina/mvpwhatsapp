/**
 * Tenant scope middleware.
 * Sets req.tenantId based on the authenticated user's role.
 *
 * - business_owner: req.tenantId = req.user.business_id
 * - platform_owner: req.tenantId = req.query.business_id or req.body.business_id (cross-tenant)
 *
 * Must be used AFTER authenticate middleware.
 */
function tenantScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: { status: 401, message: 'Authentication required' },
    });
  }

  if (req.user.role === 'business_owner') {
    if (!req.user.business_id) {
      return res.status(403).json({
        error: { status: 403, message: 'User is not associated with a business' },
      });
    }
    req.tenantId = req.user.business_id;
  } else if (req.user.role === 'platform_owner') {
    // Platform owner can optionally scope to a specific business
    req.tenantId = req.query.business_id || req.body.business_id || null;
  } else {
    return res.status(403).json({
      error: { status: 403, message: 'Unknown role — access denied' },
    });
  }

  next();
}

module.exports = tenantScope;
