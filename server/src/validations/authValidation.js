const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .notEmpty()
    .withMessage('Name is required')
    .trim(),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').optional().isString().trim(),
  body('role')
    .optional()
    .isIn(['manufacturer', 'buyer'])
    .withMessage('Role must be manufacturer or buyer'),
  // Seller fields. Optional (a seller register page always sends them,
  // older clients can still register a pending manufacturer without them).
  body('businessName').optional().isString().withMessage('Business name must be a string').trim(),
  body('businessAddress').optional().isString().withMessage('Business address must be a string').trim(),
  body('city').optional().isString().withMessage('City must be a string').trim(),
  body('state').optional().isString().withMessage('State must be a string').trim(),
  body('pincode').optional().isString().withMessage('Pincode must be a string').trim(),
  body('description').optional().isString().withMessage('Description must be a string').trim(),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = {
  registerValidation,
  loginValidation,
};
