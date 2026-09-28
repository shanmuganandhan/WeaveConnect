const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const approvalStatusFor = require('../utils/approvalStatus');

const profileFor = (user) => ({
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  approvalStatus: approvalStatusFor(user),
  isApproved: user.isApproved,
  isBlocked: user.isBlocked,
  memberSince: user.createdAt ? new Date(user.createdAt).getFullYear() : null,
});

const getProfile = asyncHandler(async (req, res) => {
  success(res, {
    message: 'Profile fetched successfully',
    data: { profile: profileFor(req.user) },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined && String(name).trim()) req.user.name = String(name).trim();
  if (phone !== undefined) req.user.phone = String(phone).trim();
  await req.user.save();

  success(res, {
    message: 'Profile updated successfully',
    data: { profile: profileFor(req.user) },
  });
});

module.exports = { getProfile, updateProfile };
