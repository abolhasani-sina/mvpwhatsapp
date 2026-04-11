const authService = require('../modules/auth/auth.service');

/**
 * Authentication middleware.
 * Extracts JWT from access_token cookie, verifies it,
 * and attaches user info to req.user.
 */
function authenticate(req, res, next) {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({
      error: { status: 401, message: 'Authentication required' },
    });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = {
      id: decoded.user_id,
      business_id: decoded.business_id,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { status: 401, message: 'Invalid or expired token' },
      });
    }
    next(err);
  }
}

module.exports = authenticate;
