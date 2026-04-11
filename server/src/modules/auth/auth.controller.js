const authService = require('./auth.service');
const authConfig = require('../../config/auth');

/**
 * POST /api/v1/auth/login
 * Authenticate user, set JWT cookies.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { status: 400, message: 'Email and password are required' },
      });
    }

    const result = await authService.login(email, password);
    if (!result) {
      return res.status(401).json({
        error: { status: 401, message: 'Invalid email or password' },
      });
    }

    res.cookie('access_token', result.accessToken, {
      ...authConfig.cookie,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', result.refreshToken, {
      ...authConfig.cookie,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ data: { user: result.user } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token cookie.
 */
async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({
        error: { status: 401, message: 'No refresh token provided' },
      });
    }

    const result = await authService.refresh(refreshToken);
    if (!result) {
      return res.status(401).json({
        error: { status: 401, message: 'Invalid refresh token' },
      });
    }

    res.cookie('access_token', result.accessToken, {
      ...authConfig.cookie,
      maxAge: 15 * 60 * 1000,
    });

    res.json({ data: { user: result.user } });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { status: 401, message: 'Invalid or expired refresh token' },
      });
    }
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Clear auth cookies.
 */
async function logout(_req, res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.json({ data: { message: 'Logged out' } });
}

module.exports = { login, refresh, logout };
