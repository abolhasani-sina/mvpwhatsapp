// ── Field-Level Encryption for Sensitive DB Values ──
// Uses AES-256-GCM with random IV per encryption
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be set in .env (min 32 hex chars)');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns base64 string: iv:authTag:ciphertext
 */
export function encryptField(plaintext) {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string.
 * Expects format: iv:authTag:ciphertext (base64)
 */
export function decryptField(ciphertext) {
  if (!ciphertext) return ciphertext;
  // If not encrypted (no colons), return as-is (backward compat with plaintext values)
  if (!ciphertext.includes(':')) return ciphertext;
  try {
    const [ivB64, authTagB64, encryptedB64] = ciphertext.split(':');
    const key = getKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // If decryption fails, return original (may be plaintext from before encryption was added)
    return ciphertext;
  }
}
