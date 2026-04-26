// ── Authentication Routes ──
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { generateTokens, refreshAccessToken, revokeTokens, authenticate } from './middleware/auth.js';
import { registerRules, loginRules, validate } from './middleware/validators.js';
import { initiateEmailVerification, verifyEmailToken } from './email-verify.js';

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

  // Send verification email (non-blocking)
  initiateEmailVerification(userId, emailTrimmed, (name || emailTrimmed.split('@')[0]).trim())
    .catch(err => console.error('Failed to send verification email:', err));

  const tokens = generateTokens(userId, res);

  res.status(201).json({
    user: { id: userId, email: emailTrimmed, name: (name || emailTrimmed.split('@')[0]).trim(), role: 'user', email_verified: 0 },
    accessToken: tokens.accessToken,
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
  // Check if account is locked
  if (user.locked_until) {
    const lockedUntil = new Date(user.locked_until);
    if (lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((lockedUntil - new Date()) / 60000);
      return res.status(403).json({ error: `Account locked. Try again in ${minutesLeft} minute(s).`, code: 'ACCOUNT_LOCKED' });
    } else {
      // Lock expired, reset
      db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
    }
  }
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    const attempts = (user.failed_attempts || 0) + 1;
    if (attempts >= 5) {
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lockedUntil, user.id);
      return res.status(403).json({ error: 'Too many failed attempts. Account locked for 30 minutes.', code: 'ACCOUNT_LOCKED' });
    }
    db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(attempts, user.id);
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.suspended) {
    return res.status(403).json({ error: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
  }
  // Successful login  reset failed attempts
  db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
  const tokens = generateTokens(user.id, res);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user', email_verified: user.email_verified || 0 },
    accessToken: tokens.accessToken,
  });
});


//  Verify Email 
router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });
  const result = verifyEmailToken(token);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json({ success: true, message: 'Email verified successfully' });
});

//  Resend Verification Email 
router.post('/resend-verification', authenticate, async (req, res) => {
  const user = db.prepare('SELECT id, email, name, email_verified FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.email_verified) return res.status(400).json({ error: 'Email already verified' });
  const recent = db.prepare(
    'SELECT created_at FROM email_verifications WHERE user_id = ? AND created_at > datetime('now', '-2 minutes')'
  ).get(user.id);
  if (recent) return res.status(429).json({ error: 'Please wait 2 minutes before requesting another email' });
  // Respond immediately, send email in background
  res.json({ success: true });
  initiateEmailVerification(user.id, user.email, user.name)
    .catch(err => console.error('Resend verification failed:', err));
});

// ── Refresh Token ──
router.post('/refresh', refreshAccessToken);

// ── Logout ──
router.post('/logout', authenticate, (req, res) => {
  revokeTokens(req.userId, res);
  res.json({ success: true });
});

// ── Get Current User ──
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, email_verified, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

export default router;
