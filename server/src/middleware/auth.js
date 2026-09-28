const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');
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
      return error(res, 401, 'Invalid or expired token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return error(res, 401, 'User not found');
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
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
