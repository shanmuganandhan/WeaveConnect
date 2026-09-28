const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
      unique: true,
    },
    items: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
  },
  { timestamps: true }
);

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
