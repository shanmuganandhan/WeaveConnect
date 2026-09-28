const express = require('express');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const {
  createReviewValidation,
  updateReviewValidation,
  reviewIdValidation,
} = require('../validations/reviewValidation');
const {
  getProductReviews,
  getMyReview,
  checkCanReview,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');

const router = express.Router();

// --- Public: anyone can read the reviews of a product ---
router.get('/product/:productId', getProductReviews);

// --- Buyer only ---
router.get(
  '/product/:productId/mine',
  authenticate,
  authorize('buyer'),
  getMyReview
);
router.get(
  '/product/:productId/can-review',
  authenticate,
  authorize('buyer'),
  checkCanReview
);
router.post(
  '/product/:productId',
  authenticate,
  authorize('buyer'),
  createReviewValidation,
  validateRequest,
  createReview
);
router.put(
  '/:reviewId',
  authenticate,
  authorize('buyer'),
  reviewIdValidation,
  updateReviewValidation,
  validateRequest,
  updateReview
);
router.delete('/:reviewId', authenticate, authorize('buyer'), reviewIdValidation, validateRequest, deleteReview);

module.exports = router;
