const { body, param } = require('express-validator');

const createReviewValidation = [
  param('productId')
    .isMongoId()
    .withMessage('Product id is not valid'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Please choose a rating between 1 and 5 stars')
    .toInt(),
  body('text')
    .optional()
    .isString()
    .withMessage('Review text must be text')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review cannot be longer than 500 characters'),
];

const reviewIdValidation = [
  param('reviewId').isMongoId().withMessage('Review id is not valid'),
];

// Editing an existing review has no :productId in the URL, so it only validates
// the body fields.
const updateReviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Please choose a rating between 1 and 5 stars')
    .toInt(),
  body('text')
    .optional()
    .isString()
    .withMessage('Review text must be text')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review cannot be longer than 500 characters'),
];

module.exports = {
  createReviewValidation,
  reviewIdValidation,
  updateReviewValidation,
};
