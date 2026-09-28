const { User, Product, Order, Cart, Settings } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const validateObjectId = require('../utils/validateObjectId');

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 });

  success(res, {
    message: 'Users fetched successfully',
    data: { users },
  });
});

const getManufacturers = asyncHandler(async (req, res) => {
  const [manufacturers, productCounts] = await Promise.all([
    User.find({ role: 'manufacturer' })
      .select('-password')
      .sort({ createdAt: -1 }),
    Product.aggregate([
      { $group: { _id: '$manufacturer', products: { $sum: 1 } } },
    ]),
  ]);

  const countMap = productCounts.reduce((acc, row) => {
    acc[row._id.toString()] = row.products;
    return acc;
  }, {});

  const withStats = manufacturers.map((m) => ({
    ...m.toObject(),
    productCount: countMap[m._id.toString()] || 0,
  }));

  success(res, {
    message: 'Manufacturers fetched successfully',
    data: { manufacturers: withStats },
  });
});

const getPendingManufacturers = asyncHandler(async (req, res) => {
  const manufacturers = await User.find({
    role: 'manufacturer',
    // New registrations use approvalStatus; older accounts only had isApproved.
    $or: [
      { approvalStatus: 'pending' },
      { approvalStatus: { $exists: false }, isApproved: false },
    ],
  })
    .select('-password')
    .sort({ createdAt: 1 });

  success(res, {
    message: 'Pending seller requests fetched successfully',
    data: { manufacturers },
  });
});

const getBuyers = asyncHandler(async (req, res) => {
  const [buyers, orderCounts, orderSpend] = await Promise.all([
    User.find({ role: 'buyer' }).select('-password').sort({ createdAt: -1 }),
    Order.aggregate([
      { $group: { _id: '$buyer', orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$buyer', spent: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const orderMap = orderCounts.reduce((acc, row) => {
    acc[row._id.toString()] = row.orders;
    return acc;
  }, {});
  const spendMap = orderSpend.reduce((acc, row) => {
    acc[row._id.toString()] = row.spent;
    return acc;
  }, {});

  const withStats = buyers.map((b) => ({
    ...b.toObject(),
    orderCount: orderMap[b._id.toString()] || 0,
    totalSpent: spendMap[b._id.toString()] || 0,
  }));

  success(res, {
    message: 'Buyers fetched successfully',
    data: { buyers: withStats },
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate('manufacturer', 'name email')
    .sort({ createdAt: -1 });

  success(res, {
    message: 'Products fetched successfully',
    data: { products },
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('buyer', 'name email')
    .populate('items.product', 'name price images manufacturer')
    .sort({ createdAt: -1 });

  success(res, {
    message: 'Orders fetched successfully',
    data: { orders },
  });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const [users, products, orders] = await Promise.all([
    User.find().select('-password'),
    Product.find(),
    Order.find(),
  ]);

  const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = nonCancelled.reduce((sum, o) => sum + o.totalAmount, 0);
  const manufacturers = users.filter((u) => u.role === 'manufacturer');
  const buyers = users.filter((u) => u.role === 'buyer');

  const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;

  const revenueByMonth = {};
  const userGrowthByMonth = {};
  const ordersByMonth = {};
  for (let i = 8; i >= 0; i--) {
    const d = new Date();
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = monthKey(m);
    revenueByMonth[key] = { month: m.toLocaleDateString('en-US', { month: 'short' }), revenue: 0, orders: 0 };
    userGrowthByMonth[key] = { month: m.toLocaleDateString('en-US', { month: 'short' }), buyers: 0, manufacturers: 0 };
    ordersByMonth[key] = 0;
  }

  orders.forEach((o) => {
    const key = monthKey(new Date(o.createdAt));
    if (revenueByMonth[key]) {
      if (o.status !== 'cancelled') revenueByMonth[key].revenue += o.totalAmount;
      revenueByMonth[key].orders += 1;
    }
  });

  users.forEach((u) => {
    const key = monthKey(new Date(u.createdAt));
    if (userGrowthByMonth[key]) {
      if (u.role === 'buyer') userGrowthByMonth[key].buyers += 1;
      if (u.role === 'manufacturer') userGrowthByMonth[key].manufacturers += 1;
    }
  });

  const orderStatusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  success(res, {
    message: 'Analytics fetched successfully',
    data: {
      analytics: {
        totals: {
          totalRevenue,
          totalUsers: users.length,
          totalBuyers: buyers.length,
          totalManufacturers: manufacturers.length,
          totalProducts: products.length,
          totalOrders: orders.length,
          pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'accepted').length,
          avgOrderValue: nonCancelled.length > 0 ? Math.round(totalRevenue / nonCancelled.length) : 0,
        },
        revenueTrend: Object.values(revenueByMonth),
        userGrowth: Object.values(userGrowthByMonth),
        orderStatus: orderStatusCounts,
        categoryDistribution: categoryCounts,
      },
    },
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product');

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  await product.deleteOne();

  success(res, { message: 'Product deleted successfully' });
});

const deleteUser = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'user');

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError(400, 'You cannot delete your own account');
  }

  await Cart.deleteMany({ buyer: user._id });
  await user.deleteOne();

  success(res, { message: 'User deleted successfully' });
});

const blockUser = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'user');

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError(400, 'You cannot block your own account');
  }

  user.isBlocked = true;
  await user.save();

  success(res, { message: 'User blocked successfully' });
});

const unblockUser = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'user');

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  user.isBlocked = false;
  await user.save();

  success(res, { message: 'User unblocked successfully' });
});

const approveManufacturer = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'manufacturer');

  const manufacturer = await User.findOne({ _id: req.params.id, role: 'manufacturer' });
  if (!manufacturer) {
    throw new AppError(404, 'Manufacturer not found');
  }

  manufacturer.approvalStatus = 'approved';
  manufacturer.isApproved = true;
  manufacturer.isBlocked = false;
  await manufacturer.save();

  success(res, { message: 'Manufacturer approved successfully' });
});

const rejectManufacturer = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'manufacturer');

  const manufacturer = await User.findOne({ _id: req.params.id, role: 'manufacturer' });
  if (!manufacturer) {
    throw new AppError(404, 'Manufacturer not found');
  }

  manufacturer.approvalStatus = 'rejected';
  manufacturer.isApproved = false;
  await manufacturer.save();

  success(res, { message: 'Manufacturer rejected successfully' });
});

const disapproveManufacturer = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'manufacturer');

  const manufacturer = await User.findOne({ _id: req.params.id, role: 'manufacturer' });
  if (!manufacturer) {
    throw new AppError(404, 'Manufacturer not found');
  }

  // "Disapprove" revokes an existing approval and sends the seller back
  // to the pending queue.
  manufacturer.approvalStatus = 'pending';
  manufacturer.isApproved = false;
  await manufacturer.save();

  success(res, { message: 'Manufacturer approval revoked' });
});

const SETTINGS_FIELDS = [
  'orderFlow',
  'autoAccept',
  'approvalRequired',
  'maxProducts',
  'commission',
  'payoutCycle',
];

const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getOrCreate();

  success(res, {
    message: 'Settings fetched successfully',
    data: { settings },
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getOrCreate();

  SETTINGS_FIELDS.forEach((key) => {
    if (req.body[key] !== undefined) {
      settings[key] = req.body[key];
    }
  });
  await settings.save();

  success(res, {
    message: 'Settings updated successfully',
    data: { settings },
  });
});

module.exports = {
  getUsers,
  getManufacturers,
  getPendingManufacturers,
  getBuyers,
  getProducts,
  getOrders,
  getAnalytics,
  deleteProduct,
  deleteUser,
  blockUser,
  unblockUser,
  approveManufacturer,
  rejectManufacturer,
  disapproveManufacturer,
  getSettings,
  updateSettings,
};
