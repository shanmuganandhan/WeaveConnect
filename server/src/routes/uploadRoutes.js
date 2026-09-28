const express = require('express');
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const uploadImages = require('../middleware/upload');
const { uploadImages: uploadImagesController } = require('../controllers/uploadController');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('manufacturer'),
  uploadImages({ folder: 'weave-connect/products' }),
  uploadImagesController
);

module.exports = router;
