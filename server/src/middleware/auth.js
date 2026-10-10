const { verifyToken } = require('../utils/jwt');
const { User, Session } = require('../models');
const { error } = require('../utils/apiResponse');
const approvalStatusFor = require('../utils/approvalStatus');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      // An expired *access* token gets a machine-readable code so the
      // frontend can silently refresh instead of logging the user out.
      // Anything else (tampered, wrong type, garbage) is a hard 401.
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }
      return error(res, 401, 'Invalid or expired token');
    }

    // Refresh tokens must never be usable as access tokens.
    if (decoded.typ && decoded.typ !== 'access') {
      return error(res, 401, 'Invalid token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return error(res, 401, 'User not found');
    }

    // Token issued before a logout-all / password reset is dead, even if it
    // has not reached its own expiry yet. Tokens without `sv` are legacy
    // tokens issued before this field existed; they stay valid until expiry.
    if (decoded.sv !== undefined && decoded.sv !== user.sessionVersion) {
      return error(res, 401, 'Session expired. Please sign in again.');
    }

    // New-style tokens are bound to a server-side session record. If that
    // session was revoked (logout on this device, or logout everywhere),
    // the token stops working immediately.
    if (decoded.sid) {
      const session = await Session.findOne({
        _id: decoded.sid,
        user: user._id,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      }).select('_id');
      if (!session) {
        return error(res, 401, 'Session expired. Please sign in again.');
      }
    }

    if (user.isBlocked) {
      return error(res, 403, 'Your account has been blocked. Contact support.');
    }

    // Defense in depth: a pending/rejected manufacturer must never use
    // seller APIs, even if they somehow hold an old token.
    if (user.role === 'manufacturer') {
      const status = approvalStatusFor(user);
      if (status === 'pending') {
        return error(res, 403, 'Your seller account is waiting for admin approval.');
      }
      if (status === 'rejected') {
        return error(res, 403, 'Your seller application has been rejected.');
      }
    }

    req.user = user;
    req.sessionId = decoded.sid || null;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
