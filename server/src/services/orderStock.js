const { Product } = require('../models');
const AppError = require('../utils/AppError');

// ---------------------------------------------------------------------------
// Shared stock helpers used by BOTH the COD order endpoint and the Razorpay
// payment endpoint, so inventory behaves identically no matter how the buyer
// pays.
// ---------------------------------------------------------------------------

// Reads every requested product from MongoDB and builds the canonical order
// items. Prices come from the database ONLY — any price/total sent by the
// frontend is ignored, so a manipulated checkout payload cannot change what
// the buyer is charged.
const buildOrderItems = async (items) => {
  // Merge duplicate product ids so one product cannot be double-counted
  // in a way that skips the stock check below.
  const quantities = new Map();
  for (const item of items) {
    const productId = String(item.productId);
    const qty = Number(item.quantity) || 1;
    quantities.set(productId, (quantities.get(productId) || 0) + qty);
  }

  const orderItems = [];
  let totalAmount = 0;

  for (const [productId, quantity] of quantities) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError(404, 'One or more products in your cart no longer exist');
    }
    if (product.isAvailable === false) {
      throw new AppError(400, `"${product.name}" is currently unavailable`);
    }
    if (product.stock < quantity) {
      throw new AppError(400, `Insufficient stock for "${product.name}"`);
    }

    orderItems.push({
      product: product._id,
      manufacturer: product.manufacturer,
      quantity,
      price: product.price,
    });
    totalAmount += product.price * quantity;
  }

  return { orderItems, totalAmount };
};

// Atomically reserves stock. The `stock: { $gte: quantity }` filter means two
// buyers racing for the LAST piece can never both succeed: MongoDB applies
// the update and the condition as one operation, so the second buyer's
// findOneAndUpdate simply matches nothing.
const reserveStock = async (orderItems) => {
  const reserved = [];

  for (const item of orderItems) {
    const product = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity }, isAvailable: { $ne: false } },
      { $inc: { stock: -item.quantity, soldCount: item.quantity } },
      { new: true }
    );

    if (!product) {
      // Roll back whatever we already reserved so a failed checkout never
      // leaks stock. (No transactions are used; this compensates instead.)
      await releaseStock(reserved);
      const current = await Product.findById(item.product);
      if (!current) throw new AppError(404, 'One or more products in your cart no longer exist');
      if (current.isAvailable === false) {
        throw new AppError(400, `"${current.name}" is currently unavailable`);
      }
      throw new AppError(400, `Insufficient stock for "${current.name}"`);
    }
    reserved.push({ product: item.product, quantity: item.quantity });
  }

  return reserved;
};

// Returns cancelled quantity back to the product. Uses an aggregation-pipeline
// update so stock and isAvailable are recalculated in one atomic operation:
//   stock     -> stock + quantity (never below zero)
//   soldCount -> max(0, soldCount - quantity)
//   isAvailable -> true when stock is now > 0, false when it is 0
const releaseStock = async (items) => {
  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;
    await Product.updateOne({ _id: item.product }, [
      {
        $set: {
          stock: { $add: ['$stock', qty] },
          soldCount: { $max: [0, { $subtract: ['$soldCount', qty] }] },
          isAvailable: { $gt: [{ $add: ['$stock', qty] }, 0] },
        },
      },
    ]);
  }
};

module.exports = { buildOrderItems, reserveStock, releaseStock };
