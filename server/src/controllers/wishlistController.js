const { Wishlist, Product } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const validateObjectId = require('../utils/validateObjectId');

const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ buyer: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ buyer: req.user._id, items: [] });
  }

  await wishlist.populate('items', 'name price images category stock isAvailable manufacturer');

  success(res, {
    message: 'Wishlist fetched successfully',
    data: { items: wishlist.items },
  });
});

const addToWishlist = asyncHandler(async (req, res) => {
  validateObjectId(req.params.productId, 'product');

  const product = await Product.findById(req.params.productId);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  let wishlist = await Wishlist.findOne({ buyer: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ buyer: req.user._id, items: [] });
  }

  const exists = wishlist.items.some(
    (id) => id.toString() === product._id.toString()
  );
  if (!exists) {
    wishlist.items.push(product._id);
    await wishlist.save();
  }

  await wishlist.populate('items', 'name price images category stock isAvailable manufacturer');

  success(res, {
    statusCode: 201,
    message: 'Added to wishlist',
    data: { items: wishlist.items },
  });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  validateObjectId(req.params.productId, 'product');

  const wishlist = await Wishlist.findOne({ buyer: req.user._id });
  if (!wishlist) {
    throw new AppError(404, 'Wishlist not found');
  }

  wishlist.items = wishlist.items.filter(
    (id) => id.toString() !== req.params.productId
  );
  await wishlist.save();

  success(res, { message: 'Removed from wishlist' });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
