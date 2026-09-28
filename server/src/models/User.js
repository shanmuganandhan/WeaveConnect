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
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
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
    passwordResetOtp: {
      type: String,
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
    passwordResetToken: {
      type: String,
    },
    passwordResetTokenExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;