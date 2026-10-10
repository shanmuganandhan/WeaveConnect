const { Order, Cart } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const validateObjectId = require('../utils/validateObjectId');
const { buildOrderItems, reserveStock, releaseStock } = require('../services/orderStock');
const razorpay = require('../services/razorpay');

const ORDER_BUYER_POPULATE = { path: 'buyer', select: 'name email' };
const ORDER_PRODUCT_POPULATE = { path: 'items.product', select: 'name price images manufacturer' };

const CANCELLABLE_STATUSES = ['pending', 'accepted'];

const orderFilterFor = (user) => {
  if (user.role === 'buyer') return { buyer: user._id };
  if (user.role === 'manufacturer') return { 'items.manufacturer': user._id };
  return {};
};

const canViewOrder = (order, user) => {
  if (user.role === 'admin') return true;
  if (user.role === 'buyer') {
    const buyerId = order.buyer?._id || order.buyer;
    return buyerId.toString() === user._id.toString();
  }
  if (user.role === 'manufacturer') {
    return order.items.some((i) => i.manufacturer.toString() === user._id.toString());
  }
  return false;
};

const populateOrder = (query) =>
  query.populate(ORDER_BUYER_POPULATE).populate(ORDER_PRODUCT_POPULATE);

const attachManufacturerShare = (order, userId) => {
  const doc = order.toObject ? order.toObject() : order;
  const ownItems = (doc.items || []).filter(
    (i) => i.manufacturer && i.manufacturer.toString() === userId.toString()
  );
  doc.ownAmount = ownItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
  doc.ownQuantity = ownItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
  return doc;
};

// ---------------------------------------------------------------------------
// Refund handling for a cancelled, already-paid Razorpay order.
// Called ONLY after the atomic status flip succeeded, so exactly one code
// path ever reaches here per order — which is what makes a double refund
// impossible.
//
// refundStatus moves: not_requested -> pending -> processed | failed
// "processed" is only written after Razorpay confirms the refund; a failed
// or interrupted attempt never claims success.
// ---------------------------------------------------------------------------
const handleCancellationPayment = async (order) => {
  if (order.paymentMethod !== 'razorpay') return order;
  if (order.paymentStatus !== 'paid') return order;

  const current = order.refundStatus || 'not_requested';
  if (current !== 'not_requested') {
    // A refund was already requested for this order — never ask twice.
    return order;
  }

  order.refundStatus = 'pending';
  await order.save();

  if (!razorpay.isConfigured()) {
    order.refundStatus = 'failed';
    await order.save();
    return order;
  }

  try {
    const refund = await razorpay.createRefund(order.razorpayPaymentId, Math.round(order.totalAmount * 100));
    const status = refund && refund.status;
    if (status === 'processed') {
      order.refundStatus = 'processed';
      order.paymentStatus = 'refunded';
      order.refundedAt = new Date();
    } else if (status === 'failed') {
      order.refundStatus = 'failed';
    } else {
      // queued / pending / unknown — money movement not yet confirmed.
      order.refundStatus = 'pending';
    }
  } catch (err) {
    order.refundStatus = 'failed';
  }

  await order.save();
  return order;
};

// Shared post-cancellation work: give the stock back, then start the refund
// if the buyer had already paid through Razorpay.
const finalizeCancellation = async (order) => {
  await releaseStock(order.items);
  return handleCancellationPayment(order);
};

// ---------------------------------------------------------------------------
// Create order (Cash on delivery)
// ---------------------------------------------------------------------------
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  // Validate zip/pincode if provided
  if (shippingAddress?.zip !== undefined && shippingAddress.zip !== null && shippingAddress.zip !== '') {
    if (typeof shippingAddress.zip !== 'string' || !/^\d{6}$/.test(shippingAddress.zip.trim())) {
      throw new AppError(400, 'PIN code must be a 6-digit number');
    }
  }

  // Cash on delivery is the only method on this endpoint; Razorpay orders
  // are created through /api/payment/create-order instead.
  if (paymentMethod && paymentMethod !== 'cod') {
    throw new AppError(400, 'Payment method must be cod');
  }

  // Prices and availability are read from MongoDB here — the frontend's
  // total, price or discount fields are never trusted.
  const { orderItems, totalAmount } = await buildOrderItems(items);
  await reserveStock(orderItems);

  let order;
  try {
    order = await Order.create({
      buyer: req.user._id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
    });
  } catch (err) {
    // Order could not be written — give the reserved stock back.
    await releaseStock(orderItems);
    throw err;
  }

  await order.populate(ORDER_BUYER_POPULATE);

  // The sarees have now been ordered, so the buyer's saved cart is emptied here
  // on the server as well as in the browser. Doing it server-side means that
  // refreshing the page after checkout does not bring the items that were
  // already purchased back into the cart.
  await Cart.deleteOne({ buyer: req.user._id });
  await order.populate(ORDER_PRODUCT_POPULATE);

  success(res, {
    statusCode: 201,
    message: 'Order created successfully',
    data: { order },
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await populateOrder(
    Order.find(orderFilterFor(req.user)).sort({ createdAt: -1 })
  );

  const payload =
    req.user.role === 'manufacturer'
      ? orders.map((o) => attachManufacturerShare(o, req.user._id))
      : orders;

  success(res, {
    message: 'Orders fetched successfully',
    data: { orders: payload },
  });
});

const getOrder = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order');

  const order = await populateOrder(Order.findById(req.params.id));
  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  if (!canViewOrder(order, req.user)) {
    throw new AppError(403, 'Access denied');
  }

  const payload =
    req.user.role === 'manufacturer'
      ? attachManufacturerShare(order, req.user._id)
      : order;

  success(res, {
    message: 'Order fetched successfully',
    data: { order: payload },
  });
});

// ---------------------------------------------------------------------------
// Buyer self-service cancellation.
//
// Three conditions are re-checked against the database (not just hidden in
// React): the caller is authenticated, the order belongs to this buyer, and
// the status is one that may still be cancelled.
// ---------------------------------------------------------------------------
const cancelOrder = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order');

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  const buyerId = order.buyer?._id || order.buyer;
  if (buyerId.toString() !== req.user._id.toString()) {
    throw new AppError(403, 'You can only cancel your own orders');
  }

  if (order.status === 'cancelled') {
    throw new AppError(409, 'Order is already cancelled');
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new AppError(400, 'This order can no longer be cancelled');
  }

  // The atomic flip is the gate against double cancellation: the filter only
  // matches while the status is still pending/accepted, so a second (or
  // concurrent) request matches nothing — stock can then never be restored
  // twice and no second refund can ever start.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, buyer: req.user._id, status: { $in: CANCELLABLE_STATUSES } },
    { $set: { status: 'cancelled' } },
    { new: true }
  );

  if (!updated) {
    throw new AppError(409, 'Order could not be cancelled. It may have just changed state.');
  }

  const finalized = await finalizeCancellation(updated);
  const populated = await populateOrder(Order.findById(finalized._id));

  success(res, {
    message:
      finalized.refundStatus && finalized.refundStatus !== 'not_requested'
        ? 'Order cancelled. Your refund status is shown with the order.'
        : 'Order cancelled successfully',
    data: { order: populated, refundStatus: finalized.refundStatus || 'not_requested' },
  });
});

// ---------------------------------------------------------------------------
// Status updates (manufacturer accept/ship/deliver, admin management)
// ---------------------------------------------------------------------------
const ALLOWED_STATUSES = ['pending', 'accepted', 'shipped', 'delivered', 'cancelled'];
const MANUFACTURER_STATUSES = ['accepted', 'shipped', 'delivered'];

const updateOrderStatus = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order');

  const { status } = req.body;
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new AppError(400, 'Invalid order status');
  }

  const order = await populateOrder(Order.findById(req.params.id));
  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  if (!canViewOrder(order, req.user)) {
    throw new AppError(403, 'Access denied');
  }

  if (order.status === 'cancelled') {
    throw new AppError(409, 'Order is already cancelled');
  }

  if (req.user.role === 'manufacturer') {
    if (!MANUFACTURER_STATUSES.includes(status)) {
      throw new AppError(403, 'Manufacturers can only accept, ship or deliver orders');
    }
  }

  if (status === 'cancelled') {
    if (req.user.role === 'manufacturer') {
      throw new AppError(403, 'Manufacturers cannot cancel orders');
    }
    // Same rule as the buyer endpoint: only pending/accepted orders may be
    // cancelled, by anyone — the backend enforces it, the UI merely mirrors it.
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new AppError(400, 'Only pending or accepted orders can be cancelled');
    }
  }

  // Atomic status transition — only one concurrent request can win, so the
  // stock restore / refund below happens exactly once.
  const previousStatus = order.status;
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: previousStatus },
    { $set: { status } },
    { new: true }
  );

  if (!updated) {
    throw new AppError(409, 'Order status changed. Please refresh and try again.');
  }

  if (status === 'cancelled') {
    await finalizeCancellation(updated);
  }

  const populated = await populateOrder(Order.findById(updated._id));

  success(res, {
    message: 'Order status updated successfully',
    data: { order: populated },
  });
});

module.exports = { createOrder, getOrders, getOrder, cancelOrder, updateOrderStatus };
