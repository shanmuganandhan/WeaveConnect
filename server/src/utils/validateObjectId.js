const mongoose = require('mongoose');
const AppError = require('./AppError');

const validateObjectId = (id, resource = 'resource') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${resource} id`);
  }
};

module.exports = validateObjectId;
