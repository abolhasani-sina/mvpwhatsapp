// ── JWT Authentication Middleware ──
import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Generate access + refresh token pair
export function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });

  // Store refresh token in DB
  db.prepare(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, datetime(\'now\', ?))'
  ).run(userId, refreshToken, JWT_REFRESH_EXPIRY.replace('d', ' days').replace('h', ' hours'));

  return { accessToken, refreshToken };
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
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Refresh token handler
export function refreshAccessToken(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Check token exists in DB (not revoked)
    const stored = db.prepare(
      'SELECT id FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > datetime(\'now\')'
    ).get(refreshToken, payload.userId);

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
export function revokeTokens(userId) {
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
}

// Cleanup expired refresh tokens (call periodically)
export function cleanupExpiredTokens() {
  db.prepare('DELETE FROM refresh_tokens WHERE expires_at < datetime(\'now\')').run();
}
