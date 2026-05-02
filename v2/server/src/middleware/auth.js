// ── JWT Authentication Middleware ──
import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Generate access + refresh token pair
export function generateTokens(userId, res) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
  // Store refresh token in DB
  db.prepare(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  const _expiryMs = JWT_REFRESH_EXPIRY.endsWith('d') ? parseInt(JWT_REFRESH_EXPIRY) * 24 * 60 * 60 * 1000 : parseInt(JWT_REFRESH_EXPIRY) * 60 * 60 * 1000;
  const _expiresAt = new Date(Date.now() + _expiryMs).toISOString().replace('T', ' ').substring(0, 19);
  ).run(userId, refreshToken, _expiresAt);
  // Set refresh token as httpOnly cookie
  if (res) {
    res.cookie('rt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });
  }
  return { accessToken };
}

// Verify access token — attaches req.userId
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;

    // Load fresh role + suspension state from DB (authoritative; not from JWT)
    const user = db.prepare('SELECT role, suspended FROM users WHERE id = ?').get(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    if (user.suspended) {
      return res.status(403).json({ error: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
    }
    req.userRole = user.role || 'user';
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Restrict route to platform owners only — must run AFTER authenticate
export function requireOwner(req, res, next) {
  if (req.userRole !== 'platform_owner') {
    return res.status(403).json({ error: 'Platform owner access required' });
  }
  next();
}

// Refresh token handler
export function refreshAccessToken(req, res) {
  const refreshToken = req.cookies?.rt;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Check token exists in DB (not revoked)
    const stored = db.prepare(
      'SELECT id FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > ?'
    ).get(refreshToken, payload.userId, new Date().toISOString().replace('T', ' ').substring(0, 19));

    if (!stored) {
      return res.status(401).json({ error: 'Refresh token revoked or expired' });
    }

    // Rotate: delete old, issue new pair
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    const tokens = generateTokens(payload.userId);

    res.json(tokens);
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

// Revoke all refresh tokens for a user (logout)
export function revokeTokens(userId, res) {
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
  if (res) {
    res.clearCookie('rt', { path: '/api/auth/refresh' });
  }
}

// Cleanup expired refresh tokens (call periodically)
export function cleanupExpiredTokens() {
  db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?').run(new Date().toISOString().replace('T', ' ').substring(0, 19));
}
