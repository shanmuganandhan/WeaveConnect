const express = require('express');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  createProductValidation,
  updateProductValidation,
} = require('../validations/productValidation');
const validateRequest = require('../middleware/validateRequest');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', authenticate, authorize('manufacturer'), createProductValidation, validateRequest, createProduct);
router.put('/:id', authenticate, authorize('manufacturer'), updateProductValidation, validateRequest, updateProduct);
router.delete('/:id', authenticate, authorize('manufacturer'), deleteProduct);

module.exports = router;
