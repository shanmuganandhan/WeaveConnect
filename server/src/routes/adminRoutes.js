const express = require('express');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { updateOrderStatusValidation } = require('../validations/orderValidation');
const { updateOrderStatus } = require('../controllers/orderController');
const {
  getUsers,
  getManufacturers,
  getPendingManufacturers,
  getBuyers,
  getProducts,
  getOrders,
  getAnalytics,
  deleteProduct,
  deleteUser,
  blockUser,
  unblockUser,
  approveManufacturer,
  rejectManufacturer,
  disapproveManufacturer,
  getSettings,
  updateSettings,
} = require('../controllers/adminController');
const { updateSettingsValidation } = require('../validations/settingsValidation');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/users', getUsers);
router.get('/manufacturers', getManufacturers);
router.get('/manufacturers/pending', getPendingManufacturers);
router.get('/buyers', getBuyers);
router.get('/products', getProducts);
router.get('/orders', getOrders);
router.get('/analytics', getAnalytics);
router.get('/settings', getSettings);

router.patch('/settings', updateSettingsValidation, validateRequest, updateSettings);

router.delete('/product/:id', deleteProduct);
router.delete('/user/:id', deleteUser);

router.patch('/user/:id/block', blockUser);
router.patch('/user/:id/unblock', unblockUser);
router.patch('/manufacturer/:id/approve', approveManufacturer);
router.patch('/manufacturer/:id/reject', rejectManufacturer);
router.patch('/manufacturer/:id/disapprove', disapproveManufacturer);
router.patch('/order/:id/status', updateOrderStatusValidation, validateRequest, updateOrderStatus);

module.exports = router;
