const { success } = require('../utils/apiResponse');

const healthCheck = (req, res) => {
  success(res, { message: 'WeaveConnect API is running' });
};

module.exports = { healthCheck };
