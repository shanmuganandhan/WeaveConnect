const { validationResult } = require('express-validator');
const { error } = require('../utils/apiResponse');

const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return error(res, 400, 'Validation error', errors);
  }
  next();
};

module.exports = validateRequest;
