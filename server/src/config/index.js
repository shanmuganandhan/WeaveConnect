require('dotenv').config();

// Security check: refuse to start with a missing or obviously weak JWT secret.
// A hard-coded fallback would let anyone who has read the source code sign valid
// login tokens, so we fail fast with a clear message instead.
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    'JWT_SECRET is missing. Copy server/.env.example to server/.env and set a long random JWT_SECRET.'
  );
}

if (jwtSecret.length < 16) {
  throw new Error('JWT_SECRET is too short. Use at least 16 characters.');
}

module.exports = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/weaveconnect',
  jwtSecret,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  // Short-lived access token. Refresh tokens live for jwtExpire (JWT_EXPIRE),
  // so an existing JWT_EXPIRE=7d deployment keeps the same overall session
  // length while stolen access tokens die quickly.
  jwtAccessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
  // Gmail SMTP settings, used only to send password-reset OTP emails.
  // These stay on the server and are never sent to the browser.
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  emailFrom: process.env.EMAIL_FROM,
  // Razorpay (test mode). The secret never leaves the server.
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  // Optional comma-separated allowlist, e.g. https://weaveconnect.vercel.app
  corsOrigin: process.env.CORS_ORIGIN,
  // Optional rate-limit tuning (requests per window per key).
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 200,
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 8,
  otpRateLimitMax: Number(process.env.OTP_RATE_LIMIT_MAX) || 3,
  otpVerifyRateLimitMax: Number(process.env.OTP_VERIFY_RATE_LIMIT_MAX) || 8,
  paymentRateLimitMax: Number(process.env.PAYMENT_RATE_LIMIT_MAX) || 30,
};
