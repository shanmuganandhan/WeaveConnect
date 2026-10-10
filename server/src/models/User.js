const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // The bcrypt hash. `select: false` keeps it out of every query result by
    // default, so a hash can never leak through an API response by accident.
    // Login explicitly opts back in with `.select('+password')` because
    // bcrypt.compare() needs the stored hash to verify the entered password.
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manufacturer', 'buyer'],
      default: 'buyer',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    businessName: {
      type: String,
      trim: true,
    },
    businessAddress: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // --- Password reset (forgot password) fields ---
    // The OTP itself is NEVER stored. We only keep a SHA-256 hash of it,
    // so even someone reading the database cannot see the real 6-digit code.
    // `select: false` keeps the hash out of every query result by default;
    // verifyOtp opts back in with `.select('+passwordResetOtp')`.
    passwordResetOtp: {
      type: String,
      select: false,
    },
    // The OTP stops working after this date/time. This stops an old OTP
    // from being reused much later.
    passwordResetOtpExpires: {
      type: Date,
    },
    // Counts how many wrong OTP guesses have been made. We block further
    // attempts once this reaches MAX_OTP_ATTEMPTS, so nobody can guess a
    // 6-digit code by brute force.
    passwordResetOtpAttempts: {
      type: Number,
      default: 0,
    },
    // When the last OTP email was sent. Used to enforce a resend cooldown
    // so one person cannot spam the mailbox.
    passwordResetOtpLastSentAt: {
      type: Date,
    },
    // After the correct OTP is entered we hand the browser a random
    // resetToken. Only its hash is stored, and it expires quickly. This is
    // what proves the OTP was verified, so the new password can be set.
    // Never selected by default: resetPassword finds it with a query filter
    // instead of reading it off a loaded document.
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpires: {
      type: Date,
    },

    // Session generation counter. Every access/refresh token carries the
    // value the user had when it was issued; bumping it (logout-all or a
    // password reset) instantly invalidates every older token, even ones
    // that are still inside their normal expiry window.
    sessionVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Secrets are kept out of query results with `select: false` (see above) plus
// the explicit `sanitizeUser()` allow-list in authController, which is what the
// auth responses are built from.
//
// Do NOT add a schema-level `toJSON`/`toObject` transform here. In mongoose 9 a
// transform on a *referenced* model stops populated parent documents from being
// converted to plain objects, so `res.json()` on anything that populates a user
// (products, orders, carts, reviews, payments...) dies with
// "Converting circular structure to JSON" and the request returns a 500.

const User = mongoose.model('User', userSchema);

module.exports = User;