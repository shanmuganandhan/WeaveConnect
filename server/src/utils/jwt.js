const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

// SHA-256 of a refresh token. The Session collection only ever stores this
// hash, so the raw refresh token exists solely in the browser.
const hashToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

// Access token: short-lived, sent on every API call.
// `sid` ties it to one server-side session; `sv` ties it to the user's
// current session generation so logout-all / password reset can kill it.
const generateAccessToken = (user, sessionId) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role,
      typ: 'access',
      ...(sessionId ? { sid: String(sessionId) } : {}),
      ...(user.sessionVersion !== undefined ? { sv: user.sessionVersion } : {}),
    },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpire }
  );

// Refresh token: only accepted by POST /api/auth/refresh, never by the
// regular auth middleware. Expires with the overall session lifetime.
//
// `jti` is what makes rotation meaningful: without it, two refresh tokens
// minted for the same user inside the same second (same payload, same `iat`)
// are byte-for-byte identical, so "the old token stops working" would be
// false. A random id makes every token unique even when they are signed in
// the same instant.
const generateRefreshToken = (user, sessionId) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role,
      typ: 'refresh',
      ...(sessionId ? { sid: String(sessionId) } : {}),
      ...(user.sessionVersion !== undefined ? { sv: user.sessionVersion } : {}),
      jti: crypto.randomUUID(),
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );

const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

// Kept for backwards compatibility with older call sites/tests.
const generateToken = (userId, role) =>
  jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: config.jwtExpire });

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
};
