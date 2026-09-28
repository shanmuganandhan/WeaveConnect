const { error } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors;

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

  error(res, statusCode, message, errors);
};

module.exports = errorHandler;
