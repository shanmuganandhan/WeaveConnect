const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;
const { error } = require('../utils/apiResponse');
const config = require('../config');

// Email-address key when one was sent, otherwise the caller's IP
// (through the IPv6-safe helper express-rate-limit ships).
const emailOrIp = (req) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  return email || ipKeyGenerator(req.ip);
};

// Shared shape: JSON error body (never an HTML default page) and a
// machine-readable code the frontend can show as a normal message.
const jsonHandler = (message) => (req, res, /* next */) => {
  error(res, 429, message, undefined);
};

// Safety net for everything under /api/auth — generous per-IP cap so one
// office/school IP is never locked out, while scripted floods are stopped.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please try again later.',
  handler: jsonHandler('Too many requests. Please try again later.'),
});

// Failed logins only: a burst of wrong passwords for ONE email address is
// throttled (keyed by email), while successful sign-ins never count.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: emailOrIp,
  message: 'Too many failed sign-in attempts. Please wait a few minutes and try again.',
  handler: jsonHandler('Too many failed sign-in attempts. Please wait a few minutes and try again.'),
});

// OTP emails are expensive and easy to abuse, so they are heavily limited
// per email address (the existing 60s resend cooldown sits on top of this).
const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: config.otpRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailOrIp,
  message: 'Too many OTP requests. Please wait a few minutes before requesting another code.',
  handler: jsonHandler('Too many OTP requests. Please wait a few minutes before requesting another code.'),
});

// Brute-forcing the 6-digit code itself: capped per email address.
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: config.otpVerifyRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailOrIp,
  message: 'Too many attempts. Please request a new code and try again.',
  handler: jsonHandler('Too many attempts. Please request a new code and try again.'),
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please try again later.',
  handler: jsonHandler('Too many requests. Please try again later.'),
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.paymentRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many payment requests. Please wait a moment and try again.',
  handler: jsonHandler('Too many payment requests. Please wait a moment and try again.'),
});

module.exports = {
  authLimiter,
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  refreshLimiter,
  paymentLimiter,
};
