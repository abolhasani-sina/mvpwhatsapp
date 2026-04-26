import crypto from 'crypto';
import db from './db.js';
import { sendVerificationEmail } from './email.js';
import { createLogger } from './logger.js';

const log = createLogger('email-verify');

// Generate a secure token, store hash in DB, send email
export async function initiateEmailVerification(userId, email, name) {
  // Delete any existing tokens for this user
  db.prepare('DELETE FROM email_verifications WHERE user_id = ?').run(userId);

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).run(userId, tokenHash, expiresAt);

  await sendVerificationEmail(email, name, token);
  log.info({ userId, email }, 'verification initiated');
}

// Verify token, mark user as verified
export function verifyEmailToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = db.prepare(
    'SELECT * FROM email_verifications WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime("now")'
  ).get(tokenHash);

  if (!record) return { success: false, error: 'Invalid or expired verification link' };

  // Mark token as used
  db.prepare('UPDATE email_verifications SET used_at = datetime("now") WHERE id = ?').run(record.id);
  // Mark user as verified
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(record.user_id);

  return { success: true, userId: record.user_id };
}
