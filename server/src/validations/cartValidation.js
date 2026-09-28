const { body } = require('express-validator');

const addItemValidation = [
  body('productId').isMongoId().withMessage('Please provide a valid product id'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const updateItemValidation = [
  body('productId').isMongoId().withMessage('Please provide a valid product id'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

module.exports = { addItemValidation, updateItemValidation };
