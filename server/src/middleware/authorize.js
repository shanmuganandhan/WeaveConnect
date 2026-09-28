const { error } = require('../utils/apiResponse');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 401, 'Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return error(res, 403, 'Access denied');
    }

    next();
  };
};

module.exports = authorize;
