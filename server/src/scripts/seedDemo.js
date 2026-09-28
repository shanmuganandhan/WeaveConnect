const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('../config/db');
const { User, Product, Order, Cart, Wishlist, Review } = require('../models');

// SMALL demo dataset (college mini project)
const TARGET_MANUFACTURERS = 10;
const TARGET_BUYERS = 20;
const TARGET_PRODUCTS = 20;
const TARGET_ORDERS = 25; // between 20 and 30
const SEED_PASSWORD = 'Weave@123';
const BCRYPT_ROUNDS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

// Keep same default admin as the existing seed:admin script.
const ADMIN_DEFAULT = {
  email: 'admin@weaveconnect.com',
  password: 'Admin@123',
  name: 'Weave Connect Admin',
};

const CATEGORIES = ['Kanchipuram', 'Banarasi', 'Mysore', 'Patola', 'Pochampally', 'Paithani'];

const CATEGORY_DESCRIPTIONS = {
  Kanchipuram: 'Handwoven Kanchipuram silk with temple borders and rich zari, woven with three-ply mulberry silk.',
  Banarasi: 'Traditional Banarasi brocade woven in fine katan silk, featuring intricate jaal and paisley motifs.',
  Mysore: 'Feather-soft pure Mysore silk with a lustrous taffeta drape and a delicate contrast border.',
  Patola: 'Rare double-ikat Patola on a traditional salvi handloom, where every thread is resist-dyed before weaving.',
  Pochampally: 'Vibrant ikat patterns hand tie-dyed and woven from a silk and cotton blend for a light, airy drape.',
  Paithani: 'Classic Paithani weave with a peacock-lotus pallu and pure gold zari, finished with a kasuti border.',
};

// Demo photos point at the image files that already ship inside the buyer app
// (buyer-app/public/images). Saving their public paths in the product "images"
// array works exactly like a real uploaded image URL, so the image carousel has
// several photos to slide through without needing a Cloudinary account or any
// internet connection.
const CATEGORY_IMAGES = {
  Kanchipuram: ['/images/category-kanchipuram.jpg', '/images/category-sariborder.jpg', '/images/hero-bridal.jpg'],
  Banarasi: ['/images/category-banarasi.jpg', '/images/fabric-embroidery.jpg', '/images/story-weaver.jpg'],
  Mysore: ['/images/category-mysore.jpg', '/images/loom-kumbakonam.jpg', '/images/category-sariborder.jpg'],
  Patola: ['/images/category-pochampally.jpg', '/images/fabric-embroidery.jpg', '/images/loom-kumbakonam.jpg'],
  Pochampally: ['/images/category-pochampally.jpg', '/images/loom-kumbakonam.jpg', '/images/category-sariborder.jpg'],
  Paithani: ['/images/category-paithani.jpg', '/images/hero-bridal.jpg', '/images/fabric-embroidery.jpg'],
};

const FALLBACK_IMAGE = '/images/product-placeholder.jpg';

// A few example reviews so the ratings and review section are not empty in a
// fresh demo. The text is attached to real orders further down, which keeps the
// "only buyers who purchased it may review it" rule intact.
const REVIEW_TEXTS = [
  { rating: 5, text: 'The zari work is even cleaner than the photographs. It arrived well packed with a certificate.' },
  { rating: 4, text: 'Beautiful drape and the colour is exactly as shown. Took a day extra to arrive, worth it.' },
  { rating: 5, text: 'You can feel the difference in the weave. My mother ordered one after she saw mine.' },
  { rating: 4, text: 'Lovely saree and the border is intricate. Drying needs care, as expected for silk.' },
  { rating: 3, text: 'Good quality silk, though the colour is slightly deeper in person. Still happy with it.' },
  { rating: 5, text: 'Worth every rupee. The weave is dense and it has a proper traditional feel.' },
];

// 10 manufacturers, one per weaving hub (uses the existing 'manufacturer' role).
const MANUFACTURERS = [
  { name: 'Kanchipuram Silk House', city: 'Kanchipuram', state: 'Tamil Nadu', pincode: '631501' },
  { name: 'Sri Lakshmi Silks', city: 'Kanchipuram', state: 'Tamil Nadu', pincode: '631502' },
  { name: 'Heritage Weaves', city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001' },
  { name: 'Golden Zari House', city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221002' },
  { name: 'Traditional Silk Works', city: 'Mysuru', state: 'Karnataka', pincode: '570001' },
  { name: 'South Indian Silk House', city: 'Mysuru', state: 'Karnataka', pincode: '570002' },
  { name: 'Patan Patola House', city: 'Patan', state: 'Gujarat', pincode: '384265' },
  { name: 'Salvi Ikat Weaves', city: 'Patan', state: 'Gujarat', pincode: '384266' },
  { name: 'Pochampally Ikat Kala', city: 'Pochampally', state: 'Telangana', pincode: '508284' },
  { name: 'Paithani Golden Loom', city: 'Yeola', state: 'Maharashtra', pincode: '423401' },
];

const MANUFACTURER_DESCRIPTIONS = [
  'Authentic handwoven silk sarees crafted by master weavers.',
  'Multi-generational handloom heritage with traditional zari work.',
  'Pure silk weaves from a recognised weaving cluster.',
  'Heritage handlooms with fair-trade pricing for artisans.',
  'Direct from weavers - no middlemen, no synthetic silks.',
];

// 20 buyers. buyers[14..19] intentionally receive no orders.
const BUYER_NAMES = [
  'Aarav Sharma', 'Aisha Patel', 'Ananya Iyer', 'Arjun Reddy', 'Diya Nair',
  'Ishaan Gupta', 'Kavya Singh', 'Karthik Mehta', 'Meera Joshi', 'Nikhil Rao',
  'Priya Das', 'Rahul Menon', 'Riya Kulkarni', 'Rohan Bhatt', 'Sanvi Pillai',
  'Sneha Verma', 'Vihaan Shetty', 'Aditi Desai', 'Farhan Chauhan', 'Gauri Hegde',
];

const BUYER_CITIES = [
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Kochi', state: 'Kerala' },
];

// 20 products, 2 per manufacturer (manufacturerIndex maps into MANUFACTURERS order).
const PRODUCTS = [
  { name: 'Kanchipuram Bridal Silk', category: 'Kanchipuram', price: 45000, stock: 12, manufacturerIndex: 0 },
  { name: 'Kanchipuram Temple Border', category: 'Kanchipuram', price: 36000, stock: 8, manufacturerIndex: 0 },
  { name: 'Kanchipuram Emerald Silk', category: 'Kanchipuram', price: 41000, stock: 9, manufacturerIndex: 1 },
  { name: 'Kanchipuram Kumkum Silk', category: 'Kanchipuram', price: 39500, stock: 11, manufacturerIndex: 1 },
  { name: 'Banarasi Katan Silk', category: 'Banarasi', price: 38500, stock: 10, manufacturerIndex: 2 },
  { name: 'Banarasi Silk Dupatta Set', category: 'Banarasi', price: 29500, stock: 14, manufacturerIndex: 2 },
  { name: 'Banarasi Tanchoi Silk', category: 'Banarasi', price: 33500, stock: 15, manufacturerIndex: 3 },
  { name: 'Banarasi Kanchivaram Mix', category: 'Banarasi', price: 44500, stock: 6, manufacturerIndex: 3 },
  { name: 'Mysore Silk Royale', category: 'Mysore', price: 28000, stock: 20, manufacturerIndex: 4 },
  { name: 'Mysore Butter Silk', category: 'Mysore', price: 21500, stock: 18, manufacturerIndex: 4 },
  { name: 'Mysore Silk Festival Wear', category: 'Mysore', price: 24000, stock: 22, manufacturerIndex: 5 },
  { name: 'Mysore Silk Office Wear', category: 'Mysore', price: 19500, stock: 24, manufacturerIndex: 5 },
  { name: 'Patola Double Ikat', category: 'Patola', price: 65000, stock: 4, manufacturerIndex: 6 },
  { name: 'Patola Geometric Art', category: 'Patola', price: 72000, stock: 3, manufacturerIndex: 6 },
  { name: 'Patola Bandhani Silk', category: 'Patola', price: 69000, stock: 5, manufacturerIndex: 7 },
  { name: 'Patola Sunrise Palette', category: 'Patola', price: 74500, stock: 4, manufacturerIndex: 7 },
  { name: 'Pochampally Ikat Silk', category: 'Pochampally', price: 22000, stock: 25, manufacturerIndex: 8 },
  { name: 'Pochampally Cotton Silk', category: 'Pochampally', price: 18500, stock: 16, manufacturerIndex: 8 },
  { name: 'Paithani Peacock Motif', category: 'Paithani', price: 52000, stock: 6, manufacturerIndex: 9 },
  { name: 'Paithani Lotus Design', category: 'Paithani', price: 48000, stock: 7, manufacturerIndex: 9 },
];

const STREETS = [
  'Gandhi Street', 'MG Road', 'Weaver Colony', 'Saree Lane', 'Main Bazaar Road',
  'Temple Street', 'Handloom Nagar', 'Silk Market Road', 'River View Road', 'Heritage Lane',
];

const ORDER_STATUSES = ['pending', 'accepted', 'shipped', 'delivered', 'cancelled'];
const STATUS_WEIGHTS = [25, 15, 20, 32, 8];

// Deterministic RNG so re-seeds produce the same small dataset.
let seedValue = 20260824;
const rng = () => {
  seedValue = (seedValue * 1664525 + 1013904223) >>> 0;
  return seedValue / 4294967296;
};
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

const pickWeighted = (values, weights) => {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < values.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return values[i];
  }
  return values[values.length - 1];
};

const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);

const demoPhone = (seed) => `+91 ${9000000000 + ((seed * 7919) % 1000000000)}`;

const demoZip = () => String(100000 + randInt(0, 899999));

const buildManufacturerDocs = (passwordHash) =>
  MANUFACTURERS.map((m, i) => ({
    name: m.name,
    email: `manufacturer${i + 1}@weaveconnect.com`,
    password: passwordHash,
    phone: demoPhone(i + 1),
    role: 'manufacturer',
    approvalStatus: 'approved',
    isApproved: true,
    isBlocked: false,
    businessName: `${m.name} (${m.city})`,
    businessAddress: `${randInt(1, 180)} ${pick(STREETS)}, ${m.city}`,
    city: m.city,
    state: m.state,
    pincode: m.pincode,
    description: MANUFACTURER_DESCRIPTIONS[i % MANUFACTURER_DESCRIPTIONS.length],
    createdAt: daysAgo(randInt(30, 365)),
  }));

const buildBuyerDocs = (passwordHash) =>
  BUYER_NAMES.map((name, i) => {
    const loc = BUYER_CITIES[i % BUYER_CITIES.length];
    return {
      name,
      email: `buyer${i + 1}@weaveconnect.com`,
      password: passwordHash,
      phone: demoPhone(i + 501),
      role: 'buyer',
      approvalStatus: 'approved',
      isApproved: true,
      isBlocked: false,
      city: loc.city,
      state: loc.state,
      createdAt: daysAgo(randInt(1, 250)),
    };
  });

const buildProductDocs = (manufacturerIds) =>
  PRODUCTS.map((p, i) => {
    const manufacturer = manufacturerIds[p.manufacturerIndex];
    const createdAt = daysAgo(randInt(1, 90));
    return {
      manufacturer,
      name: p.name,
      description: CATEGORY_DESCRIPTIONS[p.category],
      category: p.category,
      price: p.price,
      stock: p.stock,
      images: CATEGORY_IMAGES[p.category] || [FALLBACK_IMAGE],
      isAvailable: p.stock > 0,
      soldCount: 0,
      createdAt,
      updatedAt: createdAt,
    };
  });

const buildOrderDocs = (buyers, products) => {
  const stockLeft = new Map();
  for (const p of products) stockLeft.set(p._id.toString(), p.stock);

  const soldByProduct = new Map();
  const decrement = (productId, qty) => {
    const current = stockLeft.get(productId.toString());
    stockLeft.set(productId.toString(), current - qty);
    soldByProduct.set(productId.toString(), (soldByProduct.get(productId.toString()) || 0) + qty);
  };

  // buyers[0..13] place orders; buyers[14..19] have none (realistic spread).
  const orderingBuyers = buyers.slice(0, 14);
  const orderDocs = [];

  for (let i = 0; i < TARGET_ORDERS; i += 1) {
    const available = products.filter((p) => (stockLeft.get(p._id.toString()) || 0) > 0);
    if (available.length === 0) break;

    const itemCount = pickWeighted([1, 2], [40, 60]);
    const chosen = [];
    while (chosen.length < itemCount && chosen.length < available.length) {
      const product = available[randInt(0, available.length - 1)];
      if (!chosen.includes(product)) chosen.push(product);
    }

    const items = chosen.map((product) => {
      const qty = Math.min(randInt(1, 3), stockLeft.get(product._id.toString()));
      decrement(product._id, qty);
      return {
        product: product._id,
        manufacturer: product.manufacturer,
        quantity: qty,
        price: product.price,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const buyer = orderingBuyers[randInt(0, orderingBuyers.length - 1)];
    const createdAt = daysAgo(randInt(0, 180));

    orderDocs.push({
      buyer: buyer._id,
      items,
      shippingAddress: {
        name: buyer.name,
        phone: buyer.phone,
        addressLine1: `${randInt(1, 220)} ${pick(STREETS)}`,
        addressLine2: '',
        city: buyer.city || 'Chennai',
        state: buyer.state || 'Tamil Nadu',
        zip: demoZip(),
      },
      totalAmount,
      status: pickWeighted(ORDER_STATUSES, STATUS_WEIGHTS),
      createdAt,
      updatedAt: createdAt,
    });
  }

  return { orderDocs, soldByProduct };
};

// Build a handful of reviews from the orders that were actually placed.
//
// Two rules are respected so the demo data stays valid:
//   1. only a non-cancelled order counts as a purchase, and
//   2. one review per buyer per product (the model has a unique index on that).
// A review is always dated after its order, so the list looks chronological.
const buildReviewDocs = (orderDocs) => {
  const reviewDocs = [];
  const seen = new Set();

  for (const order of orderDocs) {
    if (order.status === 'cancelled') continue;

    for (const item of order.items) {
      // Only review some of the purchases, so the demo has a mix of rated and
      // unrated products rather than a review on literally everything.
      if (randInt(0, 100) > 45) continue;

      const key = `${order.buyer.toString()}:${item.product.toString()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const sample = REVIEW_TEXTS[randInt(0, REVIEW_TEXTS.length - 1)];
      const reviewedAt = new Date(
        Math.min(
          order.createdAt.getTime() + randInt(2, 30) * DAY_MS,
          Date.now() - DAY_MS
        )
      );

      reviewDocs.push({
        product: item.product,
        buyer: order.buyer,
        rating: sample.rating,
        text: sample.text,
        createdAt: reviewedAt,
        updatedAt: reviewedAt,
      });
    }
  }

  return reviewDocs;
};

// ---------------------------------------------------------------------------
// Finding and removing previous demo data
// ---------------------------------------------------------------------------
// The demo accounts are easy to recognise because of their email address, so the
// seed script can clean up after a previous run without touching anything else.
// That gives us two useful properties:
//   1. running `npm run seed` twice does not create duplicate demo records, and
//   2. accounts, products or orders created by hand are never destroyed.
const DEMO_EMAIL_PATTERNS = [
  /^manufacturer\d+@weaveconnect\.com$/i,
  /^buyer\d+@weaveconnect\.com$/i,
  // An earlier version of this script used these addresses, so they are
  // recognised (and cleaned up) as well.
  /^seller\d+@weaveconnect\.demo$/i,
  /^buyer\d+@weaveconnect\.demo$/i,
];

// Turns the patterns above into a MongoDB query fragment Mongo understands.
const demoEmailQuery = () => DEMO_EMAIL_PATTERNS.map((pattern) => ({ email: pattern }));

// Walks the database and collects every record that belongs to a demo account.
// The result is reused by both the cleanup step and the validation step, so the
// script always measures exactly the dataset it is responsible for.
const collectDemoData = async () => {
  const demoUsers = await User.find({ $or: demoEmailQuery() }).select('_id role');
  const demoUserIds = demoUsers.map((u) => u._id);
  const demoManufacturerIds = demoUsers.filter((u) => u.role === 'manufacturer').map((u) => u._id);

  // Products belong to a demo seller when that seller is a demo manufacturer.
  const demoProducts = await Product.find({ manufacturer: { $in: demoManufacturerIds } }).select('_id');
  const demoProductIds = demoProducts.map((p) => p._id);

  // An order is demo data when the buyer is a demo buyer, or when it contains a
  // demo product / demo manufacturer item.
  const demoOrders = await Order.find({
    $or: [
      { buyer: { $in: demoUserIds } },
      { 'items.product': { $in: demoProductIds } },
      { 'items.manufacturer': { $in: demoManufacturerIds } },
    ],
  }).select('_id');

  return {
    demoUserIds,
    demoManufacturerIds,
    demoProductIds,
    demoOrderIds: demoOrders.map((o) => o._id),
  };
};

// Deletes only the demo records, starting with the documents that point at the
// others so we never leave a broken reference behind.
const clearDemoData = async ({ demoUserIds, demoManufacturerIds, demoProductIds, demoOrderIds }) => {
  if (demoUserIds.length === 0) {
    console.log('Cleared: no previous demo data found');
    return;
  }

  const [reviews, carts, wishlists, products, orders, users] = await Promise.all([
    Review.deleteMany({
      $or: [{ buyer: { $in: demoUserIds } }, { product: { $in: demoProductIds } }],
    }),
    Cart.deleteMany({
      $or: [{ buyer: { $in: demoUserIds } }, { 'items.product': { $in: demoProductIds } }],
    }),
    Wishlist.deleteMany({
      $or: [{ buyer: { $in: demoUserIds } }, { items: { $in: demoProductIds } }],
    }),
    Product.deleteMany({ _id: { $in: demoProductIds } }),
    Order.deleteMany({ _id: { $in: demoOrderIds } }),
    User.deleteMany({ _id: { $in: demoUserIds } }),
  ]);

  console.log(
    `Cleared previous demo data: ${users.deletedCount} users, ${products.deletedCount} products, ` +
      `${orders.deletedCount} orders, ${carts.deletedCount} carts, ` +
      `${wishlists.deletedCount} wishlists, ${reviews.deletedCount} reviews`
  );
};

// Reuses the same defaults as seedAdmin.js. Only creates an admin if none exist.
const ensureAdmin = async (passwordHash) => {
  const email = (process.env.SEED_ADMIN_EMAIL || ADMIN_DEFAULT.email).toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || ADMIN_DEFAULT.password;
  const name = process.env.SEED_ADMIN_NAME || ADMIN_DEFAULT.name;

  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log(`Admin already exists: ${existing.email}`);
    return existing;
  }

  const admin = await User.create({
    name,
    email,
    password: passwordHash,
    role: 'admin',
    approvalStatus: 'approved',
    isApproved: true,
    isBlocked: false,
  });
  console.log(`Admin created: ${admin.email}`);
  return admin;
};

// Checks that the demo dataset is complete, correctly linked and free of
// duplicates. The scope (the ids of the freshly created demo records) is passed
// in so hand-made data outside the demo accounts is never counted here.
const validateSeed = async ({ demoUserIds, demoManufacturerIds, demoProductIds, demoOrderIds }) => {
  const [
    manufacturersCount,
    buyersCount,
    productsCount,
    ordersCount,
    reviewsCount,
    duplicateEmails,
    invalidOrders,
  ] = await Promise.all([
    User.countDocuments({ _id: { $in: demoManufacturerIds } }),
    User.countDocuments({ _id: { $in: demoUserIds }, role: 'buyer' }),
    Product.countDocuments({ _id: { $in: demoProductIds } }),
    Order.countDocuments({ _id: { $in: demoOrderIds } }),
    Review.countDocuments({ buyer: { $in: demoUserIds } }),
    User.aggregate([
      { $match: { _id: { $in: demoUserIds } } },
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]),
    Order.aggregate([
      { $match: { _id: { $in: demoOrderIds } } },
      {
        $addFields: {
          computedTotal: {
            $sum: { $map: { input: '$items', as: 'it', in: { $multiply: ['$$it.price', '$$it.quantity'] } } },
          },
        },
      },
      { $match: { $expr: { $ne: ['$computedTotal', '$totalAmount'] } } },
    ]),
  ]);

  const badProductRefs = await Order.aggregate([
    { $unwind: '$items' },
    {
      $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' },
    },
    { $match: { $expr: { $eq: [{ $size: '$p' }, 0] } } },
  ]);
  const badManufacturerRefs = await Order.aggregate([
    { $unwind: '$items' },
    {
      $lookup: { from: 'users', localField: 'items.manufacturer', foreignField: '_id', as: 'm' },
    },
    { $match: { $expr: { $eq: [{ $size: '$m' }, 0] } } },
  ]);
  const badBuyerRefs = await Order.aggregate([
    {
      $lookup: { from: 'users', localField: 'buyer', foreignField: '_id', as: 'u' },
    },
    { $match: { $expr: { $eq: [{ $size: '$u' }, 0] } } },
  ]);
  const productsWithoutManufacturer = await Product.aggregate([
    {
      $lookup: { from: 'users', localField: 'manufacturer', foreignField: '_id', as: 'mf' },
    },
    { $match: { $expr: { $eq: [{ $size: '$mf' }, 0] } } },
  ]);
  const negativeStock = await Product.aggregate([{ $match: { stock: { $lt: 0 } } }]);

  // Reviews must always belong to a real buyer, a real product and a real
  // purchase, otherwise the product page would show a review the API rejects.
  const badReviewRefs = await Review.aggregate([
    {
      $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'p' },
    },
    { $match: { $expr: { $eq: [{ $size: '$p' }, 0] } } },
  ]);
  const reviewsWithoutPurchase = await Review.aggregate([
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'orders',
        let: { buyer: '$buyer', product: '$product' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$buyer', '$$buyer'] },
                  { $in: ['$$product', '$items.product'] },
                  { $ne: ['$status', 'cancelled'] },
                ],
              },
            },
          },
        ],
        as: 'matching',
      },
    },
    { $match: { $expr: { $eq: [{ $size: '$matching' }, 0] } } },
  ]);
  const duplicateReviewPairs = await Review.aggregate([
    { $group: { _id: { product: '$product', buyer: '$buyer' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  console.log('Manufacturers   :', manufacturersCount);
  console.log('Buyers          :', buyersCount);
  console.log('Products        :', productsCount);
  console.log('Orders          :', ordersCount);
  console.log('Reviews         :', reviewsCount);
  console.log('Duplicate emails:', duplicateEmails.length);
  console.log('Bad order totals:', invalidOrders.length);
  console.log('Bad product refs:', badProductRefs.length);
  console.log('Bad manufacturer refs:', badManufacturerRefs.length);
  console.log('Bad buyer refs  :', badBuyerRefs.length);
  console.log('Products w/o manufacturer:', productsWithoutManufacturer.length);
  console.log('Products with negative stock:', negativeStock.length);
  console.log('Reviews w/o product:', badReviewRefs.length);
  console.log('Reviews w/o a matching order:', reviewsWithoutPurchase.length);
  console.log('Duplicate review pairs:', duplicateReviewPairs.length);

  const errors = [];
  if (manufacturersCount !== TARGET_MANUFACTURERS) errors.push('manufacturer count mismatch');
  if (buyersCount !== TARGET_BUYERS) errors.push('buyer count mismatch');
  if (productsCount !== TARGET_PRODUCTS) errors.push('product count mismatch');
  if (ordersCount < 20 || ordersCount > 30) errors.push('order count outside 20-30 range');
  if (duplicateEmails.length > 0) errors.push('duplicate emails found');
  if (invalidOrders.length > 0) errors.push('order totals are incorrect');
  if (badProductRefs.length > 0) errors.push('order references missing product');
  if (badManufacturerRefs.length > 0) errors.push('order references missing manufacturer');
  if (badBuyerRefs.length > 0) errors.push('order references missing buyer');
  if (productsWithoutManufacturer.length > 0) errors.push('product references missing manufacturer');
  if (negativeStock.length > 0) errors.push('negative stock found');
  if (badReviewRefs.length > 0) errors.push('review references missing product');
  if (reviewsWithoutPurchase.length > 0) errors.push('review exists without a matching order');
  if (duplicateReviewPairs.length > 0) errors.push('a buyer has reviewed the same product twice');

  if (errors.length > 0) throw new Error(`Validation failed: ${errors.join(', ')}`);
  console.log('All validation checks passed.');
};

const printSummary = (manufacturers, buyers, adminEmail, products, orders, reviews) => {
  console.log('\n========================================');
  console.log('WeaveConnect Demo Data Seed Complete');
  console.log('========================================');
  console.log('');
  console.log(`Admin         : ${adminEmail}`);
  console.log(`Manufacturers : ${manufacturers}`);
  console.log(`Buyers        : ${buyers}`);
  console.log(`Products      : ${products}`);
  console.log(`Orders        : ${orders}`);
  console.log(`Reviews       : ${reviews}`);
  console.log('');
  console.log('Database      : connected successfully');
  console.log('');
  console.log('Demo logins (all demo accounts share the same password):');
  console.log('Admin:');
  console.log(`  ${adminEmail}`);
  console.log(`  Password: ${process.env.SEED_ADMIN_PASSWORD || ADMIN_DEFAULT.password}`);
  console.log('');
  console.log('Manufacturer:');
  console.log('  manufacturer1@weaveconnect.com   (manufacturer2 ... manufacturer10 also exist)');
  console.log(`  Password: ${SEED_PASSWORD}`);
  console.log('');
  console.log('Buyer:');
  console.log('  buyer1@weaveconnect.com          (buyer2 ... buyer20 also exist)');
  console.log(`  Password: ${SEED_PASSWORD}`);
  console.log('');
  console.log('========================================');
};

const seed = async () => {
  await connectDB();

  console.log('\n== Clearing previous demo data (admin + any non-demo data preserved) ==');
  await clearDemoData(await collectDemoData());

  console.log('\n== Ensuring admin account ==');
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);
  const adminHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || ADMIN_DEFAULT.password, BCRYPT_ROUNDS);
  const admin = await ensureAdmin(adminHash);

  console.log('\n== Creating manufacturers and buyers ==');
  const manufacturerDocs = buildManufacturerDocs(passwordHash);
  const buyerDocs = buildBuyerDocs(passwordHash);

  const createdUsers = await User.insertMany([...manufacturerDocs, ...buyerDocs]);
  const manufacturers = createdUsers.filter((u) => u.role === 'manufacturer');
  const buyers = createdUsers.filter((u) => u.role === 'buyer');

  console.log(`Created: ${manufacturers.length} manufacturers, ${buyers.length} buyers`);

  console.log('\n== Creating products ==');
  const productDocs = buildProductDocs(manufacturers.map((m) => m._id));
  const products = await Product.insertMany(productDocs);
  console.log(`Created: ${products.length} products`);

  console.log('\n== Creating orders ==');
  const { orderDocs, soldByProduct } = buildOrderDocs(buyers, products);
  await Order.insertMany(orderDocs);
  console.log(`Created: ${orderDocs.length} orders`);

  console.log('\n== Updating product stock and sold counts ==');
  const bulkOps = [];
  for (const [productId, sold] of soldByProduct) {
    if (sold > 0) {
      bulkOps.push({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { stock: -sold, soldCount: sold } },
        },
      });
    }
  }
  if (bulkOps.length > 0) await Product.bulkWrite(bulkOps, { ordered: false });

  console.log('\n== Creating reviews from the seeded orders ==');
  const reviewDocs = buildReviewDocs(orderDocs);
  if (reviewDocs.length > 0) await Review.insertMany(reviewDocs);
  console.log(`Created: ${reviewDocs.length} reviews`);

  console.log('\n== Validating seeded data ==');
  await validateSeed(await collectDemoData());

  printSummary(
    manufacturers.length,
    buyers.length,
    admin.email,
    products.length,
    orderDocs.length,
    reviewDocs.length
  );
  await mongoose.disconnect();
};

seed().catch(async (err) => {
  console.error('Failed to seed demo data:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* noop */
  }
  process.exit(1);
});