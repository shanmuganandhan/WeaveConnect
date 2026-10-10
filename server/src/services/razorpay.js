const crypto = require('crypto');
const config = require('../config');

// Minimal Razorpay REST client built on Node's global fetch — no extra
// dependency needed. Used only from the server; the key secret never
// leaves this process and is never included in any error message.
const API_BASE = 'https://api.razorpay.com/v1';
const REQUEST_TIMEOUT_MS = 10000;

const isConfigured = () => Boolean(config.razorpayKeyId && config.razorpayKeySecret);

const notConfiguredError = () => {
  const err = new Error('Payment gateway is not configured on this server.');
  err.code = 'RAZORPAY_NOT_CONFIGURED';
  return err;
};

const apiRequest = async (path, { method = 'POST', body } = {}) => {
  if (!isConfigured()) throw notConfiguredError();

  const auth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      // Razorpay's own description is safe to surface; credentials never are.
      const err = new Error(
        (json && json.error && json.error.description) ||
          `Payment gateway error (${res.status})`
      );
      err.status = res.status;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
};

// amountPaise must already be computed server-side from MongoDB prices.
const createOrder = async ({ amountPaise, receipt, currency = 'INR' }) => {
  const order = await apiRequest('/orders', {
    body: {
      amount: Math.round(amountPaise),
      currency,
      receipt: String(receipt).slice(0, 40),
    },
  });
  return order; // { id, amount, currency, receipt, status, ... }
};

// Creates a full-amount refund for a captured payment.
const createRefund = async (paymentId, amountPaise) => {
  const body = {};
  if (amountPaise) body.amount = Math.round(amountPaise);
  return apiRequest(`/payments/${encodeURIComponent(paymentId)}/refunds`, { body });
};

// Razorpay signs: HMAC_SHA256(razorpay_order_id + '|' + razorpay_payment_id, secret)
// Comparison is constant-time so the check itself cannot be timed.
const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!isConfigured()) throw notConfiguredError();
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;

  const expected = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(razorpaySignature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  isConfigured,
  createOrder,
  createRefund,
  verifyPaymentSignature,
};
