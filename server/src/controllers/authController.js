const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const approvalStatusFor = require('../utils/approvalStatus');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  approvalStatus: approvalStatusFor(user),
  isApproved: user.isApproved,
  isBlocked: user.isBlocked,
  businessName: user.businessName,
  businessAddress: user.businessAddress,
  city: user.city,
  state: user.state,
  pincode: user.pincode,
  description: user.description,
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const role = req.body.role === 'manufacturer' ? 'manufacturer' : 'buyer';

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(409, 'Email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Manufacturer accounts need admin approval before they can sign in.
  // Buyers and admins are approved automatically.
  const needsApproval = role === 'manufacturer';

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role,
    approvalStatus: needsApproval ? 'pending' : 'approved',
    isApproved: needsApproval ? false : true,
    businessName: req.body.businessName,
    businessAddress: req.body.businessAddress,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    description: req.body.description,
  });

  const token = generateToken(user._id, user.role);

  const data =
    role === 'manufacturer'
      ? { user: sanitizeUser(user) }
      : { user: sanitizeUser(user), token };

  success(res, {
    statusCode: 201,
    message: 'User registered successfully',
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.isBlocked) {
    throw new AppError(403, 'Your account has been blocked. Contact support.');
  }

  // Only manufacturers are gated by admin approval.
  if (user.role === 'manufacturer') {
    const status = approvalStatusFor(user);
    if (status === 'pending') {
      throw new AppError(403, 'Your seller account is waiting for admin approval.');
    }
    if (status === 'rejected') {
      throw new AppError(403, 'Your seller application has been rejected.');
    }
  }

  const token = generateToken(user._id, user.role);

  success(res, {
    message: 'Login successful',
    data: { user: sanitizeUser(user), token },
  });
});

module.exports = { register, login };
