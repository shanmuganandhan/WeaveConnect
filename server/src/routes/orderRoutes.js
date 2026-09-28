const express = require('express');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { createOrderValidation } = require('../validations/orderValidation');
const validateRequest = require('../middleware/validateRequest');
const {
  createOrder,
  getOrders,
  getOrder,
} = require('../controllers/orderController');

const router = express.Router();

router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrder);
router.post('/', authenticate, authorize('buyer'), createOrderValidation, validateRequest, createOrder);

module.exports = router;
