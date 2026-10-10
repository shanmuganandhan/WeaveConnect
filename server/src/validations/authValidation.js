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
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be at least 6 characters and at most 128 characters'),
  body('confirmPassword')
    .optional()
    .isString()
    .withMessage('Confirm password must be a string')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
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

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
];

const verifyOtpValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('otp')
    .isString()
    .withMessage('OTP must be a string')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only digits'),
];

const resetPasswordValidation = [
  body('resetToken')
    .isString()
    .withMessage('Reset token is required')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isString()
    .withMessage('New password must be a string')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('confirmPassword')
    .isString()
    .withMessage('Confirm password must be a string')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

const refreshValidation = [
  body('refreshToken')
    .isString()
    .withMessage('Refresh token is required')
    .trim()
    .notEmpty()
    .withMessage('Refresh token is required'),
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  refreshValidation,
};
