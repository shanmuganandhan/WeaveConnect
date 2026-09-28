const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const { User } = require('../models');

const DEFAULT_EMAIL = 'admin@weaveconnect.com';
const DEFAULT_PASSWORD = 'Admin@123';
const DEFAULT_NAME = 'Weave Connect Admin';

const seedAdmin = async () => {
  const email = (process.env.SEED_ADMIN_EMAIL || DEFAULT_EMAIL).toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || DEFAULT_NAME;

  await connectDB();

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin already exists: ${email}`);
      await mongoose.disconnect();
      return;
    }
    console.log(`A non-admin user exists with email ${email}. Promoting to admin...`);
    existing.role = 'admin';
    existing.approvalStatus = 'approved';
    existing.isApproved = true;
    existing.isBlocked = false;
    existing.password = await bcrypt.hash(password, 12);
    await existing.save();
    console.log(`Promoted ${email} to admin with a new password.`);
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: 'admin',
    approvalStatus: 'approved',
    isApproved: true,
    isBlocked: false,
  });

  console.log(`Admin created: ${email}`);
  await mongoose.disconnect();
};

seedAdmin().catch(async (err) => {
  console.error('Failed to seed admin:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* noop */
  }
  process.exit(1);
});
