const mongoose = require('mongoose');

// A buyer can leave one review per product. The unique index below makes the
// database enforce that rule, so two fast clicks cannot create two reviews.
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot be more than 5 stars'],
    },
    // The written part of the review. Optional, because a buyer may just leave stars.
    text: {
      type: String,
      trim: true,
      maxlength: [500, 'Review cannot be longer than 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// One review per buyer per product.
reviewSchema.index({ product: 1, buyer: 1 }, { unique: true });
// Used by the "average rating for this product" lookup.
reviewSchema.index({ product: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
