const express = require('express');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  addItemValidation,
  updateItemValidation,
} = require('../validations/cartValidation');
const validateRequest = require('../middleware/validateRequest');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require('../controllers/cartController');

const router = express.Router();

router.get('/', authenticate, authorize('buyer'), getCart);
router.post('/add', authenticate, authorize('buyer'), addItemValidation, validateRequest, addToCart);
router.put('/update', authenticate, authorize('buyer'), updateItemValidation, validateRequest, updateCartItem);
router.delete('/remove/:productId', authenticate, authorize('buyer'), removeFromCart);

module.exports = router;
