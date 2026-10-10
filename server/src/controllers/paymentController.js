const { Order, Cart } = require('../models');
const config = require('../config');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const validateObjectId = require('../utils/validateObjectId');
const razorpay = require('../services/razorpay');
const { buildOrderItems, reserveStock, releaseStock } = require('../services/orderStock');

const ORDER_BUYER_POPULATE = { path: 'buyer', select: 'name email' };
const ORDER_PRODUCT_POPULATE = { path: 'items.product', select: 'name price images manufacturer' };

const requireGateway = () => {
  if (!razorpay.isConfigured()) {
    throw new AppError(503, 'Online payment is not available right now. Please try Cash on delivery.');
  }
};

const populateOrder = async (order) => {
  await order.populate(ORDER_BUYER_POPULATE).populate(ORDER_PRODUCT_POPULATE);
  return order;
};

const findOwnedOrder = async (orderId, userId) => {
  validateObjectId(orderId, 'order');
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  const buyerId = order.buyer?._id || order.buyer;
  if (buyerId.toString() !== userId.toString()) {
    throw new AppError(403, 'Access denied');
  }
  return order;
};

// ---------------------------------------------------------------------------
// POST /api/payment/create-order
//
// Two modes:
//   1. { items, shippingAddress }  — fresh checkout from the cart.
//        Server reads product prices/stock from MongoDB (frontend totals are
//        ignored), reserves stock atomically, then asks Razorpay for a order.
//   2. { orderId }                 — retry an existing unpaid Razorpay order
//        (reuses the same Razorpay order id; no second stock reservation).
// ---------------------------------------------------------------------------
const createPaymentOrder = asyncHandler(async (req, res) => {
  requireGateway();

  const { items, shippingAddress, orderId } = req.body;

  // ---- Retry path -------------------------------------------------------
  if (orderId) {
    const order = await findOwnedOrder(orderId, req.user._id);

    if (order.paymentMethod !== 'razorpay') {
      throw new AppError(400, 'This order was not placed with online payment');
    }
    if (order.status === 'cancelled') {
      throw new AppError(409, 'This order has been cancelled');
    }
    if (order.paymentStatus === 'paid') {
      throw new AppError(409, 'This order is already paid');
    }

    if (!order.razorpayOrderId) {
      const rpOrder = await razorpay.createOrder({
        amountPaise: Math.round(order.totalAmount * 100),
        receipt: `wc_${order._id}`,
      });
      order.razorpayOrderId = rpOrder.id;
    }
    if (order.paymentStatus === 'failed') {
      order.paymentStatus = 'pending';
    }
    await order.save();

    return success(res, {
      message: 'Payment order ready',
      data: {
        keyId: config.razorpayKeyId,
        currency: 'INR',
        amount: Math.round(order.totalAmount * 100),
        razorpayOrderId: order.razorpayOrderId,
        orderId: order._id,
        order: await populateOrder(order),
      },
    });
  }

  // ---- Fresh checkout ---------------------------------------------------
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'No items to pay for');
  }

  // Same PIN rule as the cash-on-delivery endpoint, so both checkout paths
  // accept exactly the same addresses.
  if (shippingAddress?.zip !== undefined && shippingAddress.zip !== null && shippingAddress.zip !== '') {
    if (typeof shippingAddress.zip !== 'string' || !/^\d{6}$/.test(shippingAddress.zip.trim())) {
      throw new AppError(400, 'PIN code must be a 6-digit number');
    }
  }

  // Build the order items from the database: canonical price, stock check,
  // availability check. No amount, price or discount from the client is read.
  const { orderItems, totalAmount } = await buildOrderItems(items);

  // Create the Razorpay order FIRST, so a gateway failure cannot leave the
  // buyer with reserved stock they never ordered.
  const rpOrder = await razorpay.createOrder({
    amountPaise: Math.round(totalAmount * 100),
    receipt: `wc_${Date.now()}`,
  });

  await reserveStock(orderItems);

  let orderDoc;
  try {
    orderDoc = await Order.create({
      buyer: req.user._id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      razorpayOrderId: rpOrder.id,
    });
  } catch (err) {
    await releaseStock(orderItems);
    throw err;
  }

  // The order exists and its stock is reserved, exactly as on the
  // cash-on-delivery path, so the saved cart is emptied here too. Without
  // this a refresh would bring the already-ordered sarees back into the cart
  // and the buyer could order them a second time.
  await Cart.deleteOne({ buyer: req.user._id });

  const order = await populateOrder(orderDoc);

  success(res, {
    statusCode: 201,
    message: 'Payment order created',
    data: {
      keyId: config.razorpayKeyId,
      currency: rpOrder.currency || 'INR',
      amount: rpOrder.amount,
      razorpayOrderId: rpOrder.id,
      orderId: order._id,
      order,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/payment/verify
//
// The browser's "payment succeeded" claim is NEVER trusted. Razorpay signs
// order_id|payment_id with our secret; we recompute the HMAC here and only
// mark the order paid when it matches.
// ---------------------------------------------------------------------------
const verifyPayment = asyncHandler(async (req, res) => {
  requireGateway();

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const order = await findOwnedOrder(orderId, req.user._id);

  if (order.razorpayOrderId !== razorpayOrderId) {
    throw new AppError(400, 'Payment does not match this order');
  }

  // Idempotent: a double-submit of the same verified payment succeeds again
  // instead of erroring or ever double-processing anything.
  if (order.paymentStatus === 'paid') {
    if (order.razorpayPaymentId === razorpayPaymentId) {
      return success(res, {
        message: 'Payment already verified',
        data: { order: await populateOrder(order) },
      });
    }
    throw new AppError(409, 'This order has already been paid');
  }

  if (order.status === 'cancelled') {
    throw new AppError(409, 'This order has been cancelled');
  }

  const valid = razorpay.verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!valid) {
    // No state change on a bad signature — a forged "success" from the
    // browser simply fails here.
    throw new AppError(400, 'Payment verification failed');
  }

  order.paymentStatus = 'paid';
  order.paymentMethod = 'razorpay';
  order.razorpayPaymentId = razorpayPaymentId;
  order.razorpaySignature = razorpaySignature;
  await order.save();

  success(res, {
    message: 'Payment verified successfully',
    data: { order: await populateOrder(order) },
  });
});

// ---------------------------------------------------------------------------
// POST /api/payment/failure
// The buyer's payment attempt failed or was dismissed before completion.
// The order stays unpaid (retryable); it is never marked paid.
// ---------------------------------------------------------------------------
const reportPaymentFailure = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await findOwnedOrder(orderId, req.user._id);

  if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'failed';
    await order.save();
  }

  success(res, {
    message: 'Payment was not completed',
    data: { order: await populateOrder(order) },
  });
});

// ---------------------------------------------------------------------------
// POST /api/payment/webhook      (Razorpay -> server, no user session)
//
// Razorpay calls this on payment.captured / order.paid / payment.failed. It is
// the authoritative confirmation: a buyer can close the tab before the browser
// ever calls /verify, but the webhook still arrives. Every field we trust here
// is signed with the webhook secret over the exact request bytes.
//
// Rules:
//   - Missing/!configured secret  -> 503 (Razorpay retries; never trust caller)
//   - Missing/bad signature       -> 400, and no state is touched
//   - Unknown order id            -> 200 (ack; nothing to update)
//   - Replayed event for a paid order -> 200 (idempotent, no second update)
// ---------------------------------------------------------------------------
const extractWebhookRefs = (payload) => {
  const payment = payload?.payment?.entity || null;
  const order = payload?.order?.entity || null;
  const razorpayOrderId = payment?.order_id || order?.id || null;
  const razorpayPaymentId = payment?.id || null;
  return { razorpayOrderId, razorpayPaymentId };
};

const handleWebhook = asyncHandler(async (req, res) => {
  if (!razorpay.isWebhookConfigured()) {
    throw new AppError(503, 'Payment webhook is not configured on this server.');
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) throw new AppError(400, 'Missing webhook signature');
  if (!razorpay.verifyWebhookSignature(req.rawBody, signature)) {
    throw new AppError(400, 'Invalid webhook signature');
  }

  const event = req.body?.event;
  const { razorpayOrderId, razorpayPaymentId } = extractWebhookRefs(req.body?.payload);

  // Signed but we have no order to attach it to — acknowledge so Razorpay
  // stops retrying. This can happen for orders that were never created here.
  if (!razorpayOrderId) {
    return success(res, { message: 'Webhook received', data: { ignored: true } });
  }

  const order = await Order.findOne({ razorpayOrderId });

  if (order && event === 'payment.failed') {
    // Never downgrade a paid order: a late failure event cannot undo a capture.
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'failed';
      await order.save();
    }
  } else if (order && (event === 'payment.captured' || event === 'order.paid')) {
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.paymentMethod = 'razorpay';
      if (razorpayPaymentId) order.razorpayPaymentId = razorpayPaymentId;
      await order.save();
    }
  }

  success(res, { message: 'Webhook received', data: { event: event || null } });
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
  reportPaymentFailure,
  handleWebhook,
};
