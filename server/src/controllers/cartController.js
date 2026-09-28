const { Cart, Product } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const validateObjectId = require('../utils/validateObjectId');

const CART_POPULATE = { path: 'items.product', select: 'name price images manufacturer' };

// Shared rule for "can this quantity be put in a cart?".
// A cart is only a wish list, but we still block impossible quantities here so
// the buyer is not told "added successfully" and only discovers the problem at
// checkout. The order controller re-checks stock, because stock can change
// between adding to the cart and paying.
function assertPurchasable(product, quantity) {
  if (!product.isAvailable) {
    throw new AppError(400, `${product.name} is no longer available`);
  }
  if (product.stock < 1) {
    throw new AppError(400, `${product.name} is out of stock`);
  }
  if (quantity > product.stock) {
    throw new AppError(
      400,
      `Only ${product.stock} ${product.name} left in stock. Please reduce the quantity.`
    );
  }
}

const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ buyer: req.user._id }).populate(CART_POPULATE);

  success(res, {
    message: 'Cart fetched successfully',
    data: { cart: cart || { items: [] } },
  });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  validateObjectId(productId, 'product');

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  let cart = await Cart.findOne({ buyer: req.user._id });

  if (!cart) {
    assertPurchasable(product, quantity);
    cart = await Cart.create({
      buyer: req.user._id,
      items: [{ product: productId, quantity }],
    });
  } else {
    const item = cart.items.find((i) => i.product.toString() === productId);
    // When the product is already in the cart we validate the *combined*
    // quantity, not just the quantity being added right now.
    const combined = (item ? item.quantity : 0) + quantity;
    assertPurchasable(product, combined);

    if (item) {
      item.quantity = combined;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();
  }

  await cart.populate(CART_POPULATE);

  success(res, {
    statusCode: 201,
    message: 'Item added to cart',
    data: { cart },
  });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const cart = await Cart.findOne({ buyer: req.user._id });
  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    throw new AppError(404, 'Product not in cart');
  }

  // Re-check availability on update too: stock may have dropped since the item
  // was added, and the buyer may be asking for more than exists.
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }
  assertPurchasable(product, quantity);

  item.quantity = quantity;
  await cart.save();
  await cart.populate(CART_POPULATE);

  success(res, {
    message: 'Cart updated successfully',
    data: { cart },
  });
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  validateObjectId(productId, 'product');

  const cart = await Cart.findOne({ buyer: req.user._id });
  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  await cart.populate(CART_POPULATE);

  success(res, {
    message: 'Item removed from cart',
    data: { cart },
  });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
