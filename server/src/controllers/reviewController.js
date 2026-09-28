const mongoose = require('mongoose');
const { Review, Product, Order } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const validateObjectId = require('../utils/validateObjectId');

// An order that was cancelled does not count as a purchase, so those buyers
// are not allowed to review the products in it.
const PURCHASED_STATUSES = ['pending', 'accepted', 'shipped', 'delivered'];

// Shared helper: work out the average rating and total number of reviews for a
// list of products in a single database query, then attach the result to each
// product. Doing this per product would mean one extra query per card.
//
// The values are returned as new plain objects on purpose. Mongoose documents
// run in "strict" mode, so quietly assigning a field that is not in the schema
// (averageRating / totalReviews) would be dropped and never reach the client.
async function attachRatings(products) {
  const isSingle = !Array.isArray(products);
  const list = (isSingle ? [products] : products).filter(Boolean);

  const ids = list.map((p) => p._id);
  const stats = ids.length
    ? await Review.aggregate([
        { $match: { product: { $in: ids } } },
        {
          $group: {
            _id: '$product',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ])
    : [];

  const byProduct = new Map(stats.map((s) => [String(s._id), s]));

  const withRatings = list.map((product) => {
    const stat = byProduct.get(String(product._id));
    const plain = typeof product.toObject === 'function' ? product.toObject() : product;
    return {
      ...plain,
      // Round to one decimal place so the UI can show e.g. 4.5
      averageRating: stat ? Math.round(stat.averageRating * 10) / 10 : 0,
      totalReviews: stat ? stat.totalReviews : 0,
    };
  });

  return isSingle ? withRatings[0] : withRatings;
}

// Anyone (including guests) may read the reviews of a product.
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  validateObjectId(productId, 'product');

  const productExists = await Product.exists({ _id: productId });
  if (!productExists) {
    throw new AppError(404, 'Product not found');
  }

  const reviews = await Review.find({ product: productId })
    .populate('buyer', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);

  success(res, {
    message: 'Reviews fetched successfully',
    data: {
      reviews,
      averageRating: stats.length
        ? Math.round(stats[0].averageRating * 10) / 10
        : 0,
      totalReviews: stats.length ? stats[0].totalReviews : 0,
    },
  });
});

// Lets the product page show "you have already reviewed this" without the buyer
// having to attempt a submit and read an error.
const getMyReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  validateObjectId(productId, 'product');

  const review = await Review.findOne({ product: productId, buyer: req.user._id }).lean();

  success(res, {
    message: 'Your review fetched successfully',
    data: { review: review || null },
  });
});

// Returns true when this buyer has a non-cancelled order containing the product.
// Only buyers who actually bought a product may review it.
async function hasPurchased(buyerId, productId) {
  const order = await Order.exists({
    buyer: buyerId,
    'items.product': productId,
    status: { $in: PURCHASED_STATUSES },
  });
  return !!order;
}

// The product page needs to know whether to show the review form, so this
// endpoint only checks the purchase, it does not create anything.
const checkCanReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  validateObjectId(productId, 'product');

  const purchased = await hasPurchased(req.user._id, productId);
  const existing = await Review.exists({ product: productId, buyer: req.user._id });

  success(res, {
    message: 'Review eligibility checked',
    data: { canReview: purchased && !existing, purchased, alreadyReviewed: !!existing },
  });
});

const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, text = '' } = req.body;

  validateObjectId(productId, 'product');

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  // A manufacturer must not review their own product.
  if (product.manufacturer.toString() === req.user._id.toString()) {
    throw new AppError(403, 'You cannot review your own product.');
  }

  if (!(await hasPurchased(req.user._id, productId))) {
    throw new AppError(403, 'Only buyers who have purchased this product can review it.');
  }

  const existing = await Review.findOne({ product: productId, buyer: req.user._id });
  if (existing) {
    throw new AppError(409, 'You have already reviewed this product. You can edit or delete your review.');
  }

  let review;
  try {
    review = await Review.create({ product: productId, buyer: req.user._id, rating, text });
  } catch (err) {
    // The unique index caught a double submit that slipped past the check above.
    if (err.code === 11000) {
      throw new AppError(409, 'You have already reviewed this product.');
    }
    throw err;
  }

  await review.populate('buyer', 'name');

  success(res, {
    statusCode: 201,
    message: 'Review submitted successfully',
    data: { review },
  });
});

// Lets a buyer fix a typo in a review they already left.
const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, text = '' } = req.body;

  validateObjectId(reviewId, 'review');

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError(404, 'Review not found');
  }

  if (review.buyer.toString() !== req.user._id.toString()) {
    throw new AppError(403, 'You can only edit your own review.');
  }

  review.rating = rating;
  review.text = text;
  await review.save();
  await review.populate('buyer', 'name');

  success(res, {
    message: 'Review updated successfully',
    data: { review },
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  validateObjectId(reviewId, 'review');

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError(404, 'Review not found');
  }

  if (review.buyer.toString() !== req.user._id.toString()) {
    throw new AppError(403, 'You can only delete your own review.');
  }

  await review.deleteOne();

  success(res, {
    message: 'Review deleted successfully',
  });
});

module.exports = {
  attachRatings,
  getProductReviews,
  getMyReview,
  checkCanReview,
  createReview,
  updateReview,
  deleteReview,
};
