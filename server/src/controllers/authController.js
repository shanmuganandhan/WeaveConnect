const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User, Session } = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
} = require('../utils/jwt');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const approvalStatusFor = require('../utils/approvalStatus');
const { sendOtpEmail, isEmailConfigured } = require('../utils/email');

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

// ---------------------------------------------------------------------------
// Password reset tuning
// ---------------------------------------------------------------------------
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes, as advertised in the email
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // one OTP email per minute
const MAX_OTP_ATTEMPTS = 5; // wrong guesses before the OTP is burned
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // how long a verified OTP stays usable
const BCRYPT_ROUNDS = 12;

const WEAK_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'iloveyou', 'admin123', 'welcome1', 'letmein1', 'abc12345',
  '00000000', '11111111', 'aaaaaaaa',
]);

// SHA-256 of the OTP — the raw 6-digit code is never written to the database.
const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

// Cryptographically secure 6-digit code (crypto.randomInt is CSPRNG-backed).
const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

const validateNewPassword = (password, email) => {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (password.length > 128) {
    return 'Password must be at most 128 characters long';
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return 'That password is too easy to guess. Please choose a stronger one.';
  }
  if (/^(.)\1+$/.test(password)) {
    return 'Password cannot be a single repeated character.';
  }
  if (email && password.toLowerCase().includes(String(email).split('@')[0].toLowerCase())) {
    return 'Password should not contain your email address.';
  }
  return null;
};

// Clears every password-reset field on a user document (or a plain object).
const clearResetState = (user) => {
  user.passwordResetOtp = null;
  user.passwordResetOtpExpires = null;
  user.passwordResetOtpAttempts = 0;
  user.passwordResetToken = null;
  user.passwordResetTokenExpires = null;
};

// ---------------------------------------------------------------------------
// Sessions: one server-side record per signed-in device.
// ---------------------------------------------------------------------------
const issueSession = async (user, req) => {
  const refreshToken = generateRefreshToken(user);
  const { exp } = verifyToken(refreshToken);

  const session = await Session.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: (req && req.get && req.get('user-agent')) || undefined,
    expiresAt: new Date(exp * 1000),
    lastUsedAt: new Date(),
  });

  return {
    token: generateAccessToken(user, session._id),
    refreshToken,
    session,
  };
};

const revokeSessionById = async (userId, sessionId) => {
  if (!sessionId) return;
  await Session.updateOne(
    { _id: sessionId, user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

const revokeAllSessions = async (userId) => {
  await Session.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

// ---------------------------------------------------------------------------
// Register / login
// ---------------------------------------------------------------------------
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const role = req.body.role === 'manufacturer' ? 'manufacturer' : 'buyer';

  // Optional confirmation field: when a client sends it (registration forms
  // do), it must match. The stored value is always the hash of `password`.
  if (req.body.confirmPassword !== undefined && req.body.confirmPassword !== password) {
    throw new AppError(400, 'Passwords do not match');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(409, 'Email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

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

  let data;
  if (role === 'manufacturer') {
    data = { user: sanitizeUser(user) };
  } else {
    // Pick only the public tokens — never spread issueSession()'s raw return,
    // which also contains the internal Session document (tokenHash, _id, etc).
    const session = await issueSession(user, req);
    data = {
      user: sanitizeUser(user),
      token: session.token,
      refreshToken: session.refreshToken,
    };
  }

  success(res, {
    statusCode: 201,
    message: 'User registered successfully',
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Identical message for "no such email" and "wrong password" so an
  // attacker cannot probe which addresses have an account here.
  // `password` has select:false, so login is the one place that asks for it:
  // bcrypt.compare() needs the stored hash and nothing else ever does.
  const user = await User.findOne({ email }).select('+password');
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

  const session = await issueSession(user, req);

  success(res, {
    message: 'Login successful',
    data: { user: sanitizeUser(user), token: session.token, refreshToken: session.refreshToken },
  });
});

// ---------------------------------------------------------------------------
// Refresh — exchanges a refresh token for a brand-new access token.
// The refresh token itself is rotated on every call.
// ---------------------------------------------------------------------------
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new AppError(400, 'Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyToken(refreshToken);
  } catch (err) {
    throw new AppError(401, 'Invalid or expired session. Please sign in again.');
  }

  if (decoded.typ !== 'refresh') {
    throw new AppError(401, 'Invalid token');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError(401, 'User not found');
  }
  if (user.sessionVersion !== decoded.sv) {
    throw new AppError(401, 'Session expired. Please sign in again.');
  }
  if (user.isBlocked) {
    throw new AppError(403, 'Your account has been blocked. Contact support.');
  }

  const session = await Session.findOne({
    tokenHash: hashToken(refreshToken),
    user: user._id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    throw new AppError(401, 'Invalid or expired session. Please sign in again.');
  }

  // Rotate: the presented refresh token stops working immediately.
  const newRefreshToken = generateRefreshToken(user);
  const { exp } = verifyToken(newRefreshToken);
  session.tokenHash = hashToken(newRefreshToken);
  session.expiresAt = new Date(exp * 1000);
  session.lastUsedAt = new Date();
  await session.save();

  success(res, {
    message: 'Session refreshed',
    data: {
      user: sanitizeUser(user),
      token: generateAccessToken(user, session._id),
      refreshToken: newRefreshToken,
    },
  });
});

// ---------------------------------------------------------------------------
// Logout (this device) / logout everywhere.
// Logout accepts either the access token (via the auth middleware) or the
// raw refresh token in the body, so it still works when the access token
// has already expired.
// ---------------------------------------------------------------------------
const logout = asyncHandler(async (req, res) => {
  if (req.user && req.sessionId) {
    await revokeSessionById(req.user._id, req.sessionId);
  } else if (req.body && typeof req.body.refreshToken === 'string') {
    try {
      const decoded = verifyToken(req.body.refreshToken);
      if (decoded.typ === 'refresh') {
        await Session.updateOne(
          { user: decoded.userId, tokenHash: hashToken(req.body.refreshToken), revokedAt: null },
          { $set: { revokedAt: new Date() } }
        );
      }
    } catch (err) {
      // An already-invalid token means the session is unusable anyway.
    }
  }

  success(res, { message: 'Logged out successfully' });
});

const logoutAll = asyncHandler(async (req, res) => {
  await revokeAllSessions(req.user._id);
  // Bumping the session version kills every access token that was issued
  // before this moment, on every device.
  await User.updateOne({ _id: req.user._id }, { $inc: { sessionVersion: 1 } });

  success(res, { message: 'Logged out of all sessions' });
});

// ---------------------------------------------------------------------------
// Forgot password (buyer + seller; admin uses the same guarded endpoints).
// ---------------------------------------------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();

  if (!isEmailConfigured()) {
    throw new AppError(
      503,
      'Password reset email is not configured on this server. Please contact support.'
    );
  }

  const user = await User.findOne({ email });

  if (user) {
    // Resend cooldown stops one address from being used to spam a mailbox.
    const lastSent = user.passwordResetOtpLastSentAt;
    if (lastSent && Date.now() - new Date(lastSent).getTime() < OTP_RESEND_COOLDOWN_MS) {
      throw new AppError(429, 'A code was sent recently. Please wait a minute before requesting another.');
    }

    const otp = generateOtp();
    user.passwordResetOtp = hashOtp(otp);
    user.passwordResetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = new Date();
    // Any previously verified-but-unused reset token is now stale.
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    await user.save();

    try {
      await sendOtpEmail(user.email, otp);
    } catch (err) {
      // The OTP is already stored; report a send failure without leaking
      // any SMTP details. The user can retry after the cooldown.
      throw new AppError(502, 'We could not send the OTP email. Please try again later.');
    }
  }

  // Same response whether or not the address exists — no enumeration.
  success(res, {
    message: 'If an account exists for that email, a 6-digit OTP has been sent.',
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const otp = String(req.body.otp || '').trim();

  // The OTP hash is `select: false`, so it has to be opted back into here.
  const user = await User.findOne({ email }).select('+passwordResetOtp');
  // Identical answer for "no such user", "no OTP requested" and
  // "wrong OTP" so this endpoint cannot be used to probe accounts.
  if (!user || !user.passwordResetOtp) {
    throw new AppError(400, 'Invalid or expired OTP. Please request a new code.');
  }

  if (!user.passwordResetOtpExpires || user.passwordResetOtpExpires.getTime() < Date.now()) {
    clearResetState(user);
    await user.save();
    throw new AppError(400, 'OTP has expired. Please request a new code.');
  }

  if ((user.passwordResetOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    clearResetState(user);
    await user.save();
    throw new AppError(400, 'Too many incorrect attempts. Please request a new code.');
  }

  const attempts = (user.passwordResetOtpAttempts || 0) + 1;
  const expected = Buffer.from(user.passwordResetOtp, 'utf8');
  const given = Buffer.from(hashOtp(otp), 'utf8');
  const matches =
    expected.length === given.length && crypto.timingSafeEqual(expected, given);

  if (!matches) {
    user.passwordResetOtpAttempts = attempts;
    await user.save();
    if (attempts >= MAX_OTP_ATTEMPTS) {
      clearResetState(user);
      await user.save();
      throw new AppError(400, 'Too many incorrect attempts. Please request a new code.');
    }
    throw new AppError(400, `Invalid OTP. ${MAX_OTP_ATTEMPTS - attempts} attempt(s) remaining.`);
  }

  // The OTP is single-use: it is exchanged for a short-lived reset token
  // and immediately cleared, so replaying it can never work.
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetOtp = null;
  user.passwordResetOtpExpires = null;
  user.passwordResetOtpAttempts = 0;
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  success(res, {
    message: 'OTP verified. You can now set a new password.',
    data: { resetToken },
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  if (typeof resetToken !== 'string' || !resetToken) {
    throw new AppError(400, 'Reset token is required');
  }
  if (newPassword !== confirmPassword) {
    throw new AppError(400, 'Passwords do not match');
  }

  const user = await User.findOne({
    passwordResetToken: hashToken(resetToken),
    passwordResetTokenExpires: { $gt: new Date() },
  });
  if (!user) {
    throw new AppError(400, 'Invalid or expired reset request. Please start again.');
  }

  const weak = validateNewPassword(newPassword, user.email);
  if (weak) {
    throw new AppError(400, weak);
  }

  user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  // Burn the reset token so it cannot be replayed.
  clearResetState(user);
  user.passwordResetOtpLastSentAt = null;
  await user.save();

  // A password change invalidates every existing session: whoever needed
  // to reset may have been locked out by an attacker holding a token.
  await revokeAllSessions(user._id);
  await User.updateOne({ _id: user._id }, { $inc: { sessionVersion: 1 } });

  success(res, {
    message: 'Password updated successfully. Please sign in again.',
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
