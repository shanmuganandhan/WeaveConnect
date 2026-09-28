const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const { User, Product, Order, Cart, Wishlist, Review, Settings } = require('../models');

const clearAllExceptAdmin = async () => {
  await connectDB();

  console.log('Finding admin user(s)...');
  const admins = await User.find({ role: 'admin' }).select('_id email');
  console.log(`Found ${admins.length} admin user(s):`, admins.map(a => a.email).join(', '));

  if (admins.length === 0) {
    console.log('WARNING: No admin found! Nothing will be deleted for safety.');
    await mongoose.disconnect();
    return;
  }

  const adminIds = admins.map(a => a._id);

  console.log('\nDeleting all non-admin data...');

  const [
    reviews,
    carts,
    wishlists,
    products,
    orders,
    settings,
    nonAdminUsers,
  ] = await Promise.all([
    Review.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Settings.deleteMany({}),
    User.deleteMany({ _id: { $nin: adminIds } }),
  ]);

  console.log('\n=== Deletion Summary ===');
  console.log(`Reviews deleted    : ${reviews.deletedCount}`);
  console.log(`Carts deleted      : ${carts.deletedCount}`);
  console.log(`Wishlists deleted  : ${wishlists.deletedCount}`);
  console.log(`Products deleted   : ${products.deletedCount}`);
  console.log(`Orders deleted     : ${orders.deletedCount}`);
  console.log(`Settings deleted   : ${settings.deletedCount}`);
  console.log(`Non-admin users del: ${nonAdminUsers.deletedCount}`);
  console.log(`Admin users kept   : ${admins.length}`);
  console.log('========================');

  await mongoose.disconnect();
  console.log('\nDone. Database now contains only admin user(s).');
};

clearAllExceptAdmin().catch(async (err) => {
  console.error('Error:', err.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});