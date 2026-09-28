const { body } = require('express-validator');

const createProductValidation = [
  body('name')
    .isString()
    .withMessage('Product name must be a string')
    .notEmpty()
    .withMessage('Product name is required')
    .trim(),
  body('category')
    .isString()
    .withMessage('Category must be a string')
    .notEmpty()
    .withMessage('Category is required')
    .trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a number greater than or equal to 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('description').optional().isString().trim(),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isString().withMessage('Each image must be a string'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
];

const updateProductValidation = [
  body('name')
    .optional()
    .isString()
    .withMessage('Product name must be a string')
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .trim(),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .notEmpty()
    .withMessage('Category cannot be empty')
    .trim(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a number greater than or equal to 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('description').optional().isString().trim(),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isString().withMessage('Each image must be a string'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
];

module.exports = { createProductValidation, updateProductValidation };
