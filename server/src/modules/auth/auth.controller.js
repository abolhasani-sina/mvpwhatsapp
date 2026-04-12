const authService = require('./auth.service');
const authConfig = require('../../config/auth');

const MIN_PASSWORD_LENGTH = 6;

/**
 * POST /api/v1/auth/register
 * Create a new business + owner user.
 */
async function register(req, res, next) {
  try {
    const { business_name, email, password } = req.body;

    if (!business_name || !email || !password) {
      return res.status(400).json({
        error: { status: 400, message: 'business_name, email, and password are required' },
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: { status: 400, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      });
    }

    const existing = await authService.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        error: { status: 409, message: 'Email is already registered' },
      });
    }

    await authService.register({ business_name, email, password });

    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    next(err);
  }
}

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

module.exports = { register, login, refresh, logout };
