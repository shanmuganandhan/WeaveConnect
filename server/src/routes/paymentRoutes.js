const express = require('express');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { paymentLimiter } = require('../middleware/rateLimits');
const {
  createPaymentOrderValidation,
  verifyPaymentValidation,
  paymentFailureValidation,
} = require('../validations/paymentValidation');
const {
  createPaymentOrder,
  verifyPayment,
  reportPaymentFailure,
  handleWebhook,
} = require('../controllers/paymentController');

const router = express.Router();

// Razorpay's server-to-server callback. Registered BEFORE the buyer-only
// middleware below: it carries no session and no CSRF-able credentials, and
// authenticates itself with the HMAC signature instead.
router.post('/webhook', handleWebhook);

// Buyers only, every other endpoint. The Razorpay secret stays on the server —
// only the public key id is ever returned to the browser.
router.use(authenticate, authorize('buyer'), paymentLimiter);

router.post('/create-order', createPaymentOrderValidation, validateRequest, createPaymentOrder);
router.post('/verify', verifyPaymentValidation, validateRequest, verifyPayment);
router.post('/failure', paymentFailureValidation, validateRequest, reportPaymentFailure);

module.exports = router;
