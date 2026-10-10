const { error } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  // AppError uses statusCode; the Razorpay service sets `status` on gateway
  // errors. Accept either so a bad key / network blip is not masked as a 500.
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors;

  if (err.code === 'RAZORPAY_NOT_CONFIGURED') {
    statusCode = 503;
    message = 'Online payment is not available right now. Please try Cash on delivery.';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource id';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body too large';
  }

  if (process.env.NODE_ENV === 'development' && !(err instanceof AppError)) {
    console.error(err);
  }

  // Internal failures (including a bcrypt error while hashing/comparing) are
  // logged above but never echoed back to the client.
  if (statusCode >= 500 && !(err instanceof AppError)) {
    message = 'Internal Server Error';
  }

  error(res, statusCode, message, errors);
};

module.exports = errorHandler;
