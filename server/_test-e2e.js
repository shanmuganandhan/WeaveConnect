const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BASE = process.env.TEST_BASE || 'http://localhost:5000';
const TEST_DB = process.env.TEST_DB || 'mongodb://localhost:27017/weaveconnect_test';

let pass = 0;
let fail = 0;

const check = (label, cond, extra = '') => {
  if (cond) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label} ${extra}`);
  }
};

const api = async (method, path, { token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
};

const register = async (name, email, role, extra = {}) => {
  const r = await api('POST', '/api/auth/register', {
    body: { name, email, password: 'secret123', role, ...extra },
  });
  return { token: r.json?.data?.token || null, user: r.json?.data?.user || null, json: r.json };
};

const login = async (email) => {
  const r = await api('POST', '/api/auth/login', {
    body: { email, password: 'secret123' },
  });
  return { status: r.status, token: r.json?.data?.token || null, json: r.json };
};

const createAdmin = async (email) => {
  await mongoose.connect(TEST_DB);
  const { User } = require('./src/models');
  await User.create({
    name: 'E2E Admin',
    email,
    password: await bcrypt.hash('secret123', 12),
    role: 'admin',
    isApproved: true,
    isBlocked: false,
  });
  await mongoose.disconnect();
};

async function runTests({ smtp } = {}) {
  pass = 0;
  fail = 0;
  const ts = Date.now();
  const adminEmail = `admin${ts}@test.com`;
  await createAdmin(adminEmail);
  const adminLogin = await login(adminEmail);
  check('admin login -> 200 with token', adminLogin.status === 200 && !!adminLogin.token);
  const admin = adminLogin.token;

  const buyerReg = await register('Buyer', `buyer${ts}@test.com`, 'buyer');
  check('register buyer -> token issued', !!buyerReg.token);
  const buyer = buyerReg.token;

  const buyerLogin = await login(`buyer${ts}@test.com`);
  check('buyer login -> 200 with token', buyerLogin.status === 200 && !!buyerLogin.token);
  check('buyer does not need approval', buyerLogin.json?.data?.user?.approvalStatus === 'approved');

  let r = await api('POST', '/api/auth/login', { body: { email: `buyer${ts}@test.com`, password: 'wrongpass1' } });
  check('login wrong password -> 401', r.status === 401);

  const sellerFields = {
    businessName: 'Sri Lakshmi Silks',
    businessAddress: '12 Mela Street',
    city: 'Kanchipuram',
    state: 'Tamil Nadu',
    pincode: '631501',
    description: 'Handloom silk sarees',
  };

  const man1Reg = await register('Kumar', `man1${ts}@test.com`, 'manufacturer', sellerFields);
  const man2Reg = await register('Man2', `man2${ts}@test.com`, 'manufacturer');
  const man3Reg = await register('Man3', `man3${ts}@test.com`, 'manufacturer');
  const man4Reg = await register('Man4', `man4${ts}@test.com`, 'manufacturer');
  check('register manufacturer -> no token (approval flow)', man1Reg.token === null);
  check('register manufacturer user id present', !!man1Reg.user?.id);
  check('register manufacturer pending status', man1Reg.user?.approvalStatus === 'pending');
  check('register manufacturer business fields stored', man1Reg.user?.businessName === 'Sri Lakshmi Silks' && man1Reg.user?.city === 'Kanchipuram');

  r = await api('POST', '/api/auth/register', {
    body: { name: 'Sellr', email: `badseller${ts}@test.com`, password: 'secret123', role: 'manufacturer' },
  });
  check('register manufacturer without business fields still pending', r.status === 201 && r.json?.data?.user?.approvalStatus === 'pending');

  const unapprovedLogin = await login(`man1${ts}@test.com`);
  check('login unapproved manufacturer -> 403', unapprovedLogin.status === 403);
  check('pending message shown', unapprovedLogin.json?.message?.includes('waiting for admin approval'));

  r = await api('GET', '/api/admin/manufacturers/pending', { token: admin });
  check('pending list -> 200', r.status === 200);
  const pendingIds = (r.json?.data?.manufacturers || []).map((m) => m._id);
  check('pending list contains man1/man3/man4', pendingIds.includes(man1Reg.user.id) && pendingIds.includes(man3Reg.user.id) && pendingIds.includes(man4Reg.user.id));

  r = await api('GET', '/api/admin/manufacturers/pending');
  check('pending list without token -> 401', r.status === 401);
  r = await api('GET', '/api/admin/manufacturers/pending', { token: buyer });
  check('pending list as buyer -> 403', r.status === 403);

  r = await api('PATCH', `/api/admin/manufacturer/${man1Reg.user.id}/approve`, { token: admin });
  check('approve man1 -> 200', r.status === 200);
  r = await api('PATCH', `/api/admin/manufacturer/${man2Reg.user.id}/approve`, { token: admin });
  check('approve man2 -> 200', r.status === 200);

  r = await api('PATCH', `/api/admin/manufacturer/${man3Reg.user.id}/reject`, { token: admin });
  check('reject man3 -> 200', r.status === 200);

  r = await api('PATCH', `/api/admin/manufacturer/${man4Reg.user.id}/approve`);
  check('approve without token -> 401', r.status === 401);
  r = await api('PATCH', `/api/admin/manufacturer/${man4Reg.user.id}/approve`, { token: buyer });
  check('buyer cannot approve -> 403', r.status === 403);

  const man1Login = await login(`man1${ts}@test.com`);
  const man2Login = await login(`man2${ts}@test.com`);
  check('login approved manufacturer -> 200 with token', man1Login.status === 200 && !!man1Login.token);
  const man1 = man1Login.token;
  const man2 = man2Login.token;

  r = await api('PATCH', `/api/admin/manufacturer/${man4Reg.user.id}/approve`, { token: man1 });
  check('manufacturer cannot approve -> 403', r.status === 403);

  const rejectedLogin = await login(`man3${ts}@test.com`);
  check('login rejected manufacturer -> 403', rejectedLogin.status === 403);
  check('rejected message shown', rejectedLogin.json?.message?.includes('has been rejected'));

  r = await api('PATCH', `/api/admin/manufacturer/${man4Reg.user.id}/approve`, { token: admin });
  check('approve man4 -> 200', r.status === 200);
  const man4Login = await login(`man4${ts}@test.com`);
  check('login approved man4 -> 200 with token', man4Login.status === 200 && !!man4Login.token);

  r = await api('GET', '/api/admin/manufacturers/pending', { token: admin });
  const pendingAfter = (r.json?.data?.manufacturers || []).map((m) => m._id);
  check('pending list excludes approved/rejected', !pendingAfter.includes(man1Reg.user.id) && !pendingAfter.includes(man3Reg.user.id) && !pendingAfter.includes(man4Reg.user.id));

  // ---------- PRODUCT: create ----------
  r = await api('POST', '/api/products', { body: {} });
  check('create without token -> 401', r.status === 401);

  r = await api('POST', '/api/products', { token: buyer, body: { name: 'Silk Saree', category: 'Apparel', price: 100 } });
  check('create as buyer -> 403', r.status === 403);

  r = await api('POST', '/api/products', { token: man1, body: { name: 'Silk Saree', category: 'Apparel', price: 100, stock: 10 } });
  check('create as manufacturer -> 201', r.status === 201);
  const a = r.json.data.product._id;

  r = await api('POST', '/api/products', { token: man1, body: { name: 'Cotton Fabric', category: 'Fabric', price: 50, stock: 20 } });
  const b = r.json.data.product._id;

  r = await api('POST', '/api/products', { token: man1, body: { name: 'Linen Tablecloth', category: 'Home', price: 30, stock: 5 } });
  const c = r.json.data.product._id;

  r = await api('POST', '/api/products', { token: man2, body: { name: 'Wool Blanket', category: 'Home', price: 200, stock: 2 } });
  check('create 4th product -> 201', r.status === 201);
  const d = r.json.data.product._id;

  r = await api('POST', '/api/products', { token: man1, body: { name: '', category: 'X', price: -5 } });
  check('create invalid body -> 400', r.status === 400);

  // ---------- PRODUCT: read ----------
  r = await api('GET', '/api/products');
  check('list products (no auth) -> 200', r.status === 200);
  check('list total = 4', r.json.data.pagination.total === 4);
  check('list pages = 1', r.json.data.pagination.pages === 1);
  check('list has 4 items', r.json.data.products.length === 4);
  check('list manufacturer populated', !!r.json.data.products[0].manufacturer.name);

  r = await api('GET', '/api/products?search=Silk');
  check('search "Silk" -> 1 result', r.json.data.pagination.total === 1);

  r = await api('GET', '/api/products?search=cot');
  check('search "cot" case-insensitive -> 1 result', r.json.data.pagination.total === 1);

  r = await api('GET', '/api/products?category=Home');
  check('filter category=Home -> 2 results', r.json.data.pagination.total === 2);

  r = await api('GET', '/api/products?category=Fabric&search=fabric');
  check('category+search -> 1 result', r.json.data.pagination.total === 1);

  r = await api('GET', '/api/products?limit=2&page=1');
  check('page1 limit2 -> 2 items, pages 2', r.json.data.products.length === 2 && r.json.data.pagination.pages === 2);
  r = await api('GET', '/api/products?limit=2&page=2');
  check('page2 limit2 -> 2 items', r.json.data.products.length === 2);

  r = await api('GET', `/api/products/${a}`);
  check('get by id -> 200', r.status === 200 && r.json.data.product.name === 'Silk Saree');

  r = await api('GET', '/api/products/notanid');
  check('get invalid id -> 400', r.status === 400);

  r = await api('GET', `/api/products/${mongoose.Types.ObjectId.createFromTime(1)}`);
  check('get nonexistent id -> 404', r.status === 404);

  // ---------- PRODUCT: update ----------
  r = await api('PUT', `/api/products/${a}`, { token: buyer, body: { name: 'X' } });
  check('update as buyer -> 403', r.status === 403);

  r = await api('PUT', `/api/products/${a}`, { token: man2, body: { name: 'X' } });
  check('update other manufacturer\'s product -> 403', r.status === 403);

  r = await api('PUT', `/api/products/${a}`, { token: man1, body: { name: 'Silk Saree Premium', price: 120 } });
  check('update own product -> 200', r.status === 200 && r.json.data.product.name === 'Silk Saree Premium');

  // ---------- PRODUCT: delete ----------
  r = await api('DELETE', `/api/products/${b}`, { token: man2 });
  check('delete other manufacturer\'s product -> 403', r.status === 403);

  r = await api('DELETE', `/api/products/${b}`, { token: man1 });
  check('delete own product -> 200', r.status === 200);

  r = await api('GET', `/api/products/${b}`);
  check('deleted product -> 404', r.status === 404);

  // ---------- CART ----------
  r = await api('GET', '/api/cart');
  check('get cart without token -> 401', r.status === 401);

  r = await api('GET', '/api/cart', { token: man1 });
  check('get cart as manufacturer -> 403', r.status === 403);

  r = await api('GET', '/api/cart', { token: buyer });
  check('get empty cart -> 200 items[]', r.status === 200 && r.json.data.cart.items.length === 0);

  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: 'notanid' } });
  check('add invalid productId -> 400', r.status === 400);

  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: mongoose.Types.ObjectId.createFromTime(1).toString() } });
  check('add nonexistent product -> 404', r.status === 404);

  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: a, quantity: 2 } });
  check('add product qty2 -> 201, 1 item', r.status === 201 && r.json.data.cart.items.length === 1 && r.json.data.cart.items[0].quantity === 2);

  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: a, quantity: 3 } });
  check('add same product again -> qty 5', r.json.data.cart.items.length === 1 && r.json.data.cart.items[0].quantity === 5);

  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: c, quantity: 1 } });
  check('add second product -> 2 items', r.json.data.cart.items.length === 2);

  r = await api('PUT', '/api/cart/update', { token: buyer, body: { productId: a, quantity: 7 } });
  check('update quantity -> 7', r.status === 200 && r.json.data.cart.items.find((i) => i.product._id === a).quantity === 7);

  r = await api('PUT', '/api/cart/update', { token: buyer, body: { productId: d, quantity: 1 } });
  check('update product not in cart -> 404', r.status === 404);

  r = await api('DELETE', `/api/cart/remove/${a}`, { token: buyer });
  check('remove product -> 200, 1 item left', r.status === 200 && r.json.data.cart.items.length === 1);

  r = await api('DELETE', '/api/cart/remove/notanid', { token: buyer });
  check('remove invalid productId -> 400', r.status === 400);

  r = await api('DELETE', `/api/cart/remove/${c}`, { token: buyer });
  check('remove last product -> 200, 0 items', r.status === 200 && r.json.data.cart.items.length === 0);

  // ---------- ORDERS ----------
  r = await api('GET', '/api/orders');
  check('get orders without token -> 401', r.status === 401);

  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: a, quantity: 1 } });
  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: d, quantity: 2 } });
  r = await api('POST', '/api/orders', {
    token: buyer,
    body: {
      items: [
        { productId: a, quantity: 1 },
        { productId: d, quantity: 2 },
      ],
      shippingAddress: { name: 'Buyer', phone: '9000000000', addressLine1: '1 Silk Road', city: 'Kanchipuram', state: 'TN', zip: '600001' },
    },
  });
  check('create order -> 201', r.status === 201);
  const orderId = r.json?.data?.order?._id;
  check('order totalAmount = 520', r.json?.data?.order?.totalAmount === 520);

  r = await api('GET', `/api/orders/${orderId}`, { token: man1 });
  check('manufacturer view order ownAmount = 120', r.json?.data?.order?.ownAmount === 120);
  check('manufacturer view order ownQuantity = 1', r.json?.data?.order?.ownQuantity === 1);

  r = await api('GET', `/api/orders/${orderId}`, { token: man2 });
  check('manufacturer view order ownAmount = 400', r.json?.data?.order?.ownAmount === 400);

  r = await api('GET', '/api/manufacturer/analytics', { token: man1 });
  check('man1 analytics totalRevenue = 120 (own share)', r.json?.data?.analytics?.totalRevenue === 120);

  r = await api('GET', '/api/manufacturer/analytics', { token: man2 });
  check('man2 analytics totalRevenue = 400 (own share)', r.json?.data?.analytics?.totalRevenue === 400);

  r = await api('PATCH', `/api/manufacturer/orders/${orderId}/status`, { token: man1, body: { status: 'cancelled' } });
  check('manufacturer cannot cancel order -> 403', r.status === 403);

  r = await api('PATCH', `/api/manufacturer/orders/${orderId}/status`, { token: man1, body: { status: 'accepted' } });
  check('manufacturer accept order -> 200', r.status === 200);

  r = await api('GET', '/api/manufacturer/analytics', { token: man1 });
  check('man1 analytics after accept still 120', r.json?.data?.analytics?.totalRevenue === 120);

  r = await api('POST', '/api/orders', { token: man1, body: { items: [{ productId: a, quantity: 1 }] } });
  check('manufacturer cannot create order -> 403', r.status === 403);

  // ---------- SETTINGS ----------
  r = await api('GET', '/api/admin/settings');
  check('get settings without token -> 401', r.status === 401);

  r = await api('GET', '/api/admin/settings', { token: buyer });
  check('get settings as buyer -> 403', r.status === 403);

  r = await api('GET', '/api/admin/settings', { token: admin });
  check('get settings -> 200 with defaults', r.status === 200 && r.json?.data?.settings?.autoAccept === false && r.json?.data?.settings?.approvalRequired === true);

  r = await api('PATCH', '/api/admin/settings', { token: admin, body: { autoAccept: true, commission: '7%' } });
  check('update settings -> 200 and persisted', r.status === 200 && r.json?.data?.settings?.autoAccept === true && r.json?.data?.settings?.commission === '7%');

  r = await api('PATCH', '/api/admin/settings', { token: admin, body: { autoAccept: 'yes' } });
  check('update settings invalid boolean -> 400', r.status === 400);

  r = await api('GET', '/api/admin/settings', { token: admin });
  check('settings reload after update', r.json?.data?.settings?.autoAccept === true && r.json?.data?.settings?.commission === '7%');

  // ---------- CART: stock and availability rules ----------
  // The order above already reduced stock: "a" (Silk Saree) has 9 left and
  // "d" (Wool Blanket) is now completely out of stock.
  r = await api('GET', `/api/products/${a}`);
  check('order reduced stock of product a to 9', r.json?.data?.product?.stock === 9);

  r = await api('GET', `/api/products/${d}`);
  check('order reduced stock of product d to 0', r.json?.data?.product?.stock === 0);

  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: a, quantity: 999 } });
  check('add more than available stock -> 400', r.status === 400 && /stock/i.test(r.json?.message || ''));

  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: d, quantity: 1 } });
  check('add out-of-stock product -> 400', r.status === 400 && /out of stock/i.test(r.json?.message || ''));

  await api('POST', '/api/cart/add', { token: buyer, body: { productId: c, quantity: 4 } });
  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: c, quantity: 4 } });
  check('repeat add is checked against combined quantity -> 400', r.status === 400);

  r = await api('PUT', '/api/cart/update', { token: buyer, body: { productId: c, quantity: 500 } });
  check('update beyond stock -> 400', r.status === 400);

  r = await api('PUT', '/api/cart/update', { token: buyer, body: { productId: c, quantity: 2 } });
  check('update within stock -> 200', r.status === 200);

  r = await api('GET', '/api/cart', { token: buyer });
  check('cart item exposes its own _id (used as React key)', !!r.json?.data?.cart?.items?.[0]?._id);

  // A product the manufacturer has taken off sale must not be addable.
  r = await api('PUT', `/api/products/${c}`, { token: man1, body: { isAvailable: false } });
  check('manufacturer can mark product unavailable', r.status === 200 && r.json?.data?.product?.isAvailable === false);
  r = await api('POST', '/api/cart/add', { token: buyer, body: { productId: c, quantity: 1 } });
  check('add unavailable product -> 400', r.status === 400 && /no longer available/i.test(r.json?.message || ''));
  await api('PUT', `/api/products/${c}`, { token: man1, body: { isAvailable: true } });
  await api('DELETE', `/api/cart/remove/${c}`, { token: buyer });

  // ---------- SEARCH: description and manufacturer filter ----------
  r = await api('GET', '/api/products?search=zzzznotathing');
  check('search with no match -> 0 results', r.json?.data?.pagination?.total === 0);

  r = await api('GET', `/api/products?manufacturer=${man1Reg.user.id}`);
  check('filter by manufacturer -> only that seller products', r.json?.data?.pagination?.total === 2);

  r = await api('GET', '/api/products?manufacturer=notanid');
  check('filter by invalid manufacturer id -> 400', r.status === 400);

  // ---------- REVIEWS ----------
  // The buyer has a delivered-eligible order containing product "a", so they are
  // allowed to review it. Product "c" was never bought, so they are not.
  r = await api('GET', `/api/reviews/product/${a}`);
  check('read reviews without token -> 200', r.status === 200);
  check('no reviews yet', r.json?.data?.totalReviews === 0 && r.json?.data?.averageRating === 0);

  r = await api('GET', `/api/reviews/product/${mongoose.Types.ObjectId.createFromTime(1)}`);
  check('reviews for unknown product -> 404', r.status === 404);

  r = await api('POST', `/api/reviews/product/${a}`, { body: { rating: 5 } });
  check('submit review without token -> 401', r.status === 401);

  r = await api('POST', `/api/reviews/product/${a}`, { token: man1, body: { rating: 5 } });
  check('submit review as manufacturer -> 403', r.status === 403);

  r = await api('POST', `/api/reviews/product/${c}`, { token: buyer, body: { rating: 5 } });
  check('review a product never purchased -> 403', r.status === 403);

  r = await api('POST', `/api/reviews/product/${a}`, { token: buyer, body: { rating: 6 } });
  check('rating above 5 -> 400', r.status === 400);

  r = await api('POST', `/api/reviews/product/${a}`, { token: buyer, body: { text: 'no rating' } });
  check('missing rating -> 400', r.status === 400);

  r = await api('POST', `/api/reviews/product/${a}`, { token: buyer, body: { rating: 4, text: 'Beautiful weave, lovely drape.' } });
  check('submit review -> 201', r.status === 201);
  const reviewId = r.json?.data?.review?._id;
  check('review stores rating and text', r.json?.data?.review?.rating === 4 && /Beautiful weave/.test(r.json?.data?.review?.text || ''));
  check('review shows the buyer name', !!r.json?.data?.review?.buyer?.name);

  r = await api('GET', `/api/reviews/product/${a}`);
  check('reviews list now has 1 entry', r.json?.data?.totalReviews === 1);
  check('average rating is 4', r.json?.data?.averageRating === 4);

  r = await api('GET', `/api/reviews/product/${a}/mine`, { token: buyer });
  check('my review endpoint returns the saved review', r.json?.data?.review?._id === reviewId);

  r = await api('GET', `/api/reviews/product/${a}/can-review`, { token: buyer });
  check('can-review is false once already reviewed', r.json?.data?.canReview === false && r.json?.data?.alreadyReviewed === true);

  r = await api('POST', `/api/reviews/product/${a}`, { token: buyer, body: { rating: 2 } });
  check('second review for same product -> 409', r.status === 409);

  r = await api('PUT', `/api/reviews/${reviewId}`, { token: buyer, body: { rating: 5, text: 'Even better than I thought.' } });
  check('edit own review -> 200', r.status === 200 && r.json?.data?.review?.rating === 5);

  r = await api('GET', `/api/products/${a}`);
  check('product now shows average rating 5 and count 1', r.json?.data?.product?.averageRating === 5 && r.json?.data?.product?.totalReviews === 1);

  r = await api('GET', '/api/products?limit=100');
  const ratedCard = (r.json?.data?.products || []).find((p) => p._id === a);
  check('product list cards also carry the rating', ratedCard?.averageRating === 5 && ratedCard?.totalReviews === 1);
  const unratedCard = (r.json?.data?.products || []).find((p) => p._id === c);
  check('a product with no reviews reports 0', unratedCard?.averageRating === 0 && unratedCard?.totalReviews === 0);

  // A second buyer reviews the same product, to check the average is combined.
  const buyer2Reg = await register('Buyer2', `buyer2${ts}@test.com`, 'buyer');
  r = await api('GET', `/api/reviews/product/${a}/can-review`, { token: buyer2Reg.token });
  check('a buyer who has not purchased cannot review', r.json?.data?.canReview === false && r.json?.data?.purchased === false);
  r = await api('POST', `/api/reviews/product/${a}`, { token: buyer2Reg.token, body: { rating: 4 } });
  check('second buyer who has not purchased -> 403', r.status === 403);

  // ---------- PUBLIC STORE PAGE ----------
  r = await api('GET', `/api/stores/${man1Reg.user.id}`);
  check('public store profile -> 200', r.status === 200);
  check('store shows the business name', r.json?.data?.store?.businessName === 'Sri Lakshmi Silks');
  check('store counts the seller products', r.json?.data?.store?.productCount === 2);
  check('store never exposes the seller email', r.json?.data?.store?.email === undefined);
  check('store shows the average rating across its products', r.json?.data?.store?.averageRating === 5 && r.json?.data?.store?.totalReviews === 1);

  r = await api('GET', '/api/stores/notanid');
  check('store with invalid id -> 400', r.status === 400);

  r = await api('GET', `/api/stores/${buyerReg.user.id}`);
  check('store for a non-manufacturer -> 404', r.status === 404);

  r = await api('GET', `/api/stores/${man3Reg.user.id}`);
  check('store for a rejected seller -> 404', r.status === 404);

  // ---------- REVIEW: delete ----------
  r = await api('DELETE', `/api/reviews/${reviewId}`, { token: man1 });
  check('delete someone else review -> 403', r.status === 403);

  r = await api('DELETE', `/api/reviews/${reviewId}`, { token: buyer });
  check('delete own review -> 200', r.status === 200);

  r = await api('GET', `/api/reviews/product/${a}`);
  check('review list empty again', r.json?.data?.totalReviews === 0);

  r = await api('GET', `/api/stores/${man1Reg.user.id}`);
  check('store rating resets to 0 after deleting the review', r.json?.data?.store?.averageRating === 0);

  // ---------- cleanup ----------
  await mongoose.connect(TEST_DB);
  const db = mongoose.connection.db;
  await db.collection('orders').deleteMany({});
  await db.collection('reviews').deleteMany({});
  await db.collection('products').deleteMany({});
  await db.collection('carts').deleteMany({});
  await db.collection('settings').deleteMany({});
  await db.collection('users').deleteMany({ email: { $regex: '@test.com$' } });
  await mongoose.disconnect();

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  return { pass, fail };
}

module.exports = runTests;

if (require.main === module) {
  runTests().then(({ fail }) => process.exit(fail > 0 ? 1 : 0));
}
