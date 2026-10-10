const mongoose = require('mongoose');

// One document per signed-in device ("session").
//
// The browser holds two JWTs:
//   - a short-lived ACCESS token (sent on every request), and
//   - a long-lived REFRESH token (only used at POST /api/auth/refresh).
//
// This collection is the server-side record that makes both revocable:
//   - logging out on one device revokes only that device's session, and
//   - logging out everywhere / resetting a password revokes every session.
//
// Only the SHA-256 hash of the refresh token is stored, so a database leak
// never hands out usable refresh tokens. The TTL index on expiresAt is a
// housekeeper; every lookup also checks expiresAt explicitly, because TTL
// cleanup runs in the background and can lag by up to a minute.
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    // SHA-256 hash of the current refresh token for this device.
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
    },
    userAgent: {
      type: String,
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ user: 1, revokedAt: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
