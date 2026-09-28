const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const {
  createProductValidation,
  updateProductValidation,
} = require('../validations/productValidation');
const { updateOrderStatusValidation } = require('../validations/orderValidation');
const {
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const {
  getOrders,
  getOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const {
  getMyProducts,
  getAnalytics,
  getProfile,
  updateProfile,
} = require('../controllers/manufacturerController');

const router = express.Router();

router.use(authenticate, authorize('manufacturer'));

const updateProfileValidation = [
  body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isString().trim(),
  body('businessName').optional().isString().trim(),
  body('businessAddress').optional().isString().trim(),
  body('city').optional().isString().trim(),
  body('state').optional().isString().trim(),
  body('pincode').optional().isString().trim(),
  body('description').optional().isString().trim(),
];

router.get('/products', getMyProducts);
router.post('/products', createProductValidation, validateRequest, createProduct);
router.put('/products/:id', updateProductValidation, validateRequest, updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/orders', getOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', updateOrderStatusValidation, validateRequest, updateOrderStatus);

router.get('/analytics', getAnalytics);
router.get('/profile', getProfile);
router.patch('/profile', updateProfileValidation, validateRequest, updateProfile);

module.exports = router;
