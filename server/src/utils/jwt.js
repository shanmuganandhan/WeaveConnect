const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

module.exports = { generateToken, verifyToken };