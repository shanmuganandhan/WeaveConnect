const { Product } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const validateObjectId = require('../utils/validateObjectId');
const { attachRatings } = require('./reviewController');

const PRODUCT_POPULATE = { path: 'manufacturer', select: 'name' };
const UPDATABLE_FIELDS = ['name', 'description', 'category', 'price', 'stock', 'images', 'isAvailable'];

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, category, price, stock, images, isAvailable } = req.body;

  const product = await Product.create({
    manufacturer: req.user._id,
    name,
    description,
    category,
    price,
    stock,
    images,
    isAvailable,
  });

  success(res, {
    statusCode: 201,
    message: 'Product created successfully',
    data: { product },
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const { category, manufacturer } = req.query;

  // Only accept plain text for search. A query string such as
  // "?search[$ne]=x" would otherwise arrive here as an object and break the
  // $regex below, so anything that is not a string is ignored.
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const filter = {};
  if (search) {
    // Search the product name, the category and the description so buyers can
    // find a saree by the weave, the fabric or a word in the story behind it.
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { category: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
    ];
  }
  if (category) filter.category = category;
  if (manufacturer) {
    validateObjectId(manufacturer, 'manufacturer');
    filter.manufacturer = manufacturer;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate(PRODUCT_POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  // Add averageRating / totalReviews so the cards can show a rating.
  const productsWithRatings = await attachRatings(products);

  success(res, {
    message: 'Products fetched successfully',
    data: {
      products: productsWithRatings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

const getProduct = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product');

  const product = await Product.findById(req.params.id).populate(PRODUCT_POPULATE);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  const productWithRating = await attachRatings(product);

  success(res, {
    message: 'Product fetched successfully',
    data: { product: productWithRating },
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product');

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (product.manufacturer.toString() !== req.user._id.toString()) {
    throw new AppError(403, 'You can only update your own products');
  }

  for (const field of UPDATABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  }

  await product.save();

  success(res, {
    message: 'Product updated successfully',
    data: { product },
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product');

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (product.manufacturer.toString() !== req.user._id.toString()) {
    throw new AppError(403, 'You can only delete your own products');
  }

  await product.deleteOne();

  success(res, { message: 'Product deleted successfully' });
});

module.exports = { createProduct, getProducts, getProduct, updateProduct, deleteProduct };
