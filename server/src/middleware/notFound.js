const { error } = require('../utils/apiResponse');

const notFound = (req, res) => {
  error(res, 404, 'Route not found');
};

module.exports = notFound;
