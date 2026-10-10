const express = require('express');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  refreshValidation,
} = require('../validations/authValidation');
const validateRequest = require('../middleware/validateRequest');
const { authenticate } = require('../middleware/auth');
const {
  authLimiter,
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  refreshLimiter,
} = require('../middleware/rateLimits');
const {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

// Logout works with a valid access token OR a refresh token in the body,
// so a browser can always clean up even when its access token just expired.
const authenticateIfPresent = (req, res, next) => {
  if (req.headers.authorization) return authenticate(req, res, next);
  next();
};

router.post('/register', authLimiter, registerValidation, validateRequest, register);
router.post('/login', authLimiter, loginLimiter, loginValidation, validateRequest, login);
router.post('/refresh', refreshLimiter, refreshValidation, validateRequest, refresh);
router.post('/logout', authenticateIfPresent, logout);
router.post('/logout-all', authenticate, logoutAll);

router.post(
  '/forgot-password',
  authLimiter,
  otpRequestLimiter,
  forgotPasswordValidation,
  validateRequest,
  forgotPassword
);
router.post(
  '/verify-otp',
  authLimiter,
  otpVerifyLimiter,
  verifyOtpValidation,
  validateRequest,
  verifyOtp
);
router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidation,
  validateRequest,
  resetPassword
);

module.exports = router;
