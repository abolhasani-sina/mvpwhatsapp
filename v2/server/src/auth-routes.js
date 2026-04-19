// ── Authentication Routes ──
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { generateTokens, refreshAccessToken, revokeTokens, authenticate } from './middleware/auth.js';
import { registerRules, loginRules, validate } from './middleware/validators.js';

const router = Router();
const BCRYPT_ROUNDS = 12;

// ── Register ──
router.post('/register', registerRules, validate, (req, res) => {
  const { email, password, name } = req.body;

  const emailTrimmed = email.trim().toLowerCase();

  // Check if user already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailTrimmed);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

  const result = db.prepare(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
  ).run(emailTrimmed, passwordHash, (name || emailTrimmed.split('@')[0]).trim());

  const userId = Number(result.lastInsertRowid);
  const tokens = generateTokens(userId);

  res.status(201).json({
    user: { id: userId, email: emailTrimmed, name: (name || emailTrimmed.split('@')[0]).trim() },
    ...tokens,
  });
});

// ── Login ──
router.post('/login', loginRules, validate, (req, res) => {
  const { email, password } = req.body;

  const emailTrimmed = email.trim().toLowerCase();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailTrimmed);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const tokens = generateTokens(user.id);

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    ...tokens,
  });
});

// ── Refresh Token ──
router.post('/refresh', refreshAccessToken);

// ── Logout ──
router.post('/logout', authenticate, (req, res) => {
  revokeTokens(req.userId);
  res.json({ success: true });
});

// ── Get Current User ──
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

export default router;
