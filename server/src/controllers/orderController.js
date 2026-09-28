const { Order, Product, Cart } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const validateObjectId = require('../utils/validateObjectId');

const ORDER_BUYER_POPULATE = { path: 'buyer', select: 'name email' };
const ORDER_PRODUCT_POPULATE = { path: 'items.product', select: 'name price images manufacturer' };

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

const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  // Validate zip/pincode if provided
  if (shippingAddress?.zip !== undefined && shippingAddress.zip !== null && shippingAddress.zip !== '') {
    if (typeof shippingAddress.zip !== 'string' || !/^\d{6}$/.test(shippingAddress.zip.trim())) {
      throw new AppError(400, 'PIN code must be a 6-digit number');
    }
  }

  // Cash on delivery is the only supported payment method, so an order is
  // always settled when it is delivered rather than up front.
  if (paymentMethod && paymentMethod !== 'cod') {
    throw new AppError(400, 'Payment method must be cod');
  }

  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    const quantity = item.quantity || 1;
    if (product.stock < quantity) {
      throw new AppError(400, `Insufficient stock for "${product.name}"`);
    }

    orderItems.push({
      product: product._id,
      manufacturer: product.manufacturer,
      quantity,
      price: product.price,
    });
    totalAmount += product.price * quantity;

    product.stock -= quantity;
    product.soldCount = (product.soldCount || 0) + quantity;
    await product.save();
  }

  const orderData = {
    buyer: req.user._id,
    items: orderItems,
    shippingAddress,
    totalAmount,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
  };

  const order = await Order.create(orderData);
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

  if (req.user.role === 'manufacturer') {
    if (!MANUFACTURER_STATUSES.includes(status)) {
      throw new AppError(403, 'Manufacturers can only accept, ship or deliver orders');
    }
    if (order.status === 'cancelled') {
      throw new AppError(400, 'Cannot update a cancelled order');
    }
  }

  if (status === 'cancelled' && req.user.role === 'manufacturer') {
    throw new AppError(403, 'Manufacturers cannot cancel orders');
  }

  order.status = status;
  await order.save();

  success(res, {
    message: 'Order status updated successfully',
    data: { order },
  });
});

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus };
