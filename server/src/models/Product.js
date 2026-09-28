const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Manufacturer is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: 0,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ name: 1 });
productSchema.index({ manufacturer: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
