const { User, Product, Review } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const validateObjectId = require('../utils/validateObjectId');
const approvalStatusFor = require('../utils/approvalStatus');

// Public "storefront" of a manufacturer, shown on the buyer side.
//
// Only information a shopper genuinely needs is returned. The email address is
// never sent to the browser, and the phone number is only included when the
// manufacturer chose to publish it, so a private number cannot leak by accident.
const getStoreProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, 'manufacturer');

  const manufacturer = await User.findById(id);
  if (!manufacturer || manufacturer.role !== 'manufacturer') {
    throw new AppError(404, 'Store not found');
  }

  // A store is only visible once the admin has approved the seller, and a
  // blocked seller disappears from the marketplace.
  if (approvalStatusFor(manufacturer) !== 'approved' || manufacturer.isBlocked) {
    throw new AppError(404, 'Store not found');
  }

  // Count how many products this store is currently offering.
  const [productCount, ratingAgg] = await Promise.all([
    Product.countDocuments({ manufacturer: manufacturer._id, isAvailable: true }),
    Review.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.manufacturer': manufacturer._id } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]),
  ]);

  const rating = ratingAgg.length
    ? {
        averageRating: Math.round(ratingAgg[0].averageRating * 10) / 10,
        totalReviews: ratingAgg[0].totalReviews,
      }
    : { averageRating: 0, totalReviews: 0 };

  success(res, {
    message: 'Store fetched successfully',
    data: {
      store: {
        _id: manufacturer._id,
        name: manufacturer.name,
        businessName: manufacturer.businessName || manufacturer.name,
        description: manufacturer.description || '',
        city: manufacturer.city || '',
        state: manufacturer.state || '',
        memberSince: manufacturer.createdAt,
        productCount,
        ...rating,
      },
    },
  });
});

module.exports = { getStoreProfile };
