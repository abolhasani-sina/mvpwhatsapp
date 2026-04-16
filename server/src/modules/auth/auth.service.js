const db = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth');

const SALT_ROUNDS = 10;

/**
 * Find user by email.
 */
async function findByEmail(email) {
  return db('users').where({ email }).first();
}

/**
 * Verify password against stored hash.
 */
async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Generate access token containing user_id, business_id, role.
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      user_id: user.id,
      business_id: user.business_id,
      role: user.role,
    },
    authConfig.jwtSecret,
    { expiresIn: authConfig.accessTokenExpiry }
  );
}

/**
 * Generate refresh token containing user_id only.
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { user_id: user.id },
    authConfig.jwtRefreshSecret,
    { expiresIn: authConfig.refreshTokenExpiry }
  );
}

/**
 * Verify and decode a JWT token.
 */
function verifyToken(token) {
  return jwt.verify(token, authConfig.jwtSecret);
}

/**
 * Verify and decode a refresh token (uses separate secret).
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, authConfig.jwtRefreshSecret);
}

/**
 * Login: validate credentials, return tokens.
 */
async function login(email, password) {
  const user = await findByEmail(email);
  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return null;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      business_id: user.business_id,
    },
  };
}

/**
 * Refresh: verify refresh token, issue new access token.
 */
async function refresh(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const user = await db('users').where({ id: decoded.user_id }).first();
  if (!user) {
    return null;
  }

  const accessToken = generateAccessToken(user);
  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      business_id: user.business_id,
    },
  };
}

/**
 * Hash a plaintext password.
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Register: create business + owner user in a transaction.
 */
async function register({ business_name, email, password }) {
  return db.transaction(async (trx) => {
    const [business] = await trx('businesses')
      .insert({ name: business_name, phone: '' })
      .returning('*');

    const password_hash = await hashPassword(password);

    const [user] = await trx('users')
      .insert({
        business_id: business.id,
        email,
        password_hash,
        role: 'business_owner',
      })
      .returning('*');

    return { business, user };
  });
}

module.exports = { login, refresh, verifyToken, hashPassword, findByEmail, register };
