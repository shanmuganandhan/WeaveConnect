const { Product, Order } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const approvalStatusFor = require('../utils/approvalStatus');

const WEEK = 7 * 24 * 60 * 60 * 1000;

const PRODUCT_POPULATE = { path: 'manufacturer', select: 'name' };

const getMyProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const { search, category } = req.query;

  const filter = { manufacturer: req.user._id };
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (category) filter.category = category;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate(PRODUCT_POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  success(res, {
    message: 'Products fetched successfully',
    data: {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const [products, orders] = await Promise.all([
    Product.find({ manufacturer: req.user._id }),
    Order.find({ 'items.manufacturer': req.user._id }),
  ]);

  const ownRevenue = (order) =>
    (order.items || []).reduce((sum, i) => {
      if (i.manufacturer && i.manufacturer.toString() === req.user._id.toString()) {
        return sum + (i.price || 0) * (i.quantity || 1);
      }
      return sum;
    }, 0);

  const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = nonCancelled.reduce((sum, o) => sum + ownRevenue(o), 0);
  const now = Date.now();
  const cutoff = now - WEEK;
  const prevCutoff = now - 2 * WEEK;

  const revenueBetween = (ordersList, from, to) =>
    ordersList
      .filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return o.status !== 'cancelled' && t >= from && (to ? t < to : true);
      })
      .reduce((sum, o) => sum + ownRevenue(o), 0);

  const weekRevenue = revenueBetween(orders, cutoff, now);
  const prevWeekRevenue = revenueBetween(orders, prevCutoff, cutoff);
  const weekChange = prevWeekRevenue > 0
    ? Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
    : 0;

  const ordersThisWeek = nonCancelled.filter((o) => new Date(o.createdAt).getTime() >= cutoff).length;

  const weeklySales = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const start = new Date(day).setHours(0, 0, 0, 0);
    const end = new Date(day).setHours(23, 59, 59, 999);
    const sales = nonCancelled
      .filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= start && t <= end;
      })
      .reduce((sum, o) => sum + ownRevenue(o), 0);
    weeklySales.push({ day: day.toLocaleDateString('en-US', { weekday: 'short' }), sales });
  }

  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const bestCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  success(res, {
    message: 'Analytics fetched successfully',
    data: {
      analytics: {
        totalRevenue,
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
        totalSold: products.reduce((sum, p) => sum + (p.soldCount || 0), 0),
        avgOrderValue: nonCancelled.length > 0 ? Math.round(totalRevenue / nonCancelled.length) : 0,
        weekRevenue,
        weekChange,
        ordersThisWeek,
        bestCategory,
        weeklySales,
      },
    },
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : req.user;
  success(res, {
    message: 'Profile fetched successfully',
    data: {
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        description: user.description,
        approvalStatus: approvalStatusFor(user),
        isApproved: user.isApproved,
        memberSince: user.createdAt ? new Date(user.createdAt).getFullYear() : null,
      },
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, businessName, businessAddress, city, state, pincode, description } = req.body;
  if (name !== undefined && String(name).trim()) req.user.name = String(name).trim();
  if (phone !== undefined) req.user.phone = String(phone).trim();
  if (businessName !== undefined) req.user.businessName = String(businessName).trim();
  if (businessAddress !== undefined) req.user.businessAddress = String(businessAddress).trim();
  if (city !== undefined) req.user.city = String(city).trim();
  if (state !== undefined) req.user.state = String(state).trim();
  if (pincode !== undefined) req.user.pincode = String(pincode).trim();
  if (description !== undefined) req.user.description = String(description).trim();
  await req.user.save();

  success(res, {
    message: 'Profile updated successfully',
    data: {
      profile: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        businessName: req.user.businessName,
        businessAddress: req.user.businessAddress,
        city: req.user.city,
        state: req.user.state,
        pincode: req.user.pincode,
        description: req.user.description,
        approvalStatus: approvalStatusFor(req.user),
        isApproved: req.user.isApproved,
        memberSince: req.user.createdAt ? new Date(req.user.createdAt).getFullYear() : null,
      },
    },
  });
});

module.exports = { getMyProducts, getAnalytics, getProfile, updateProfile };
