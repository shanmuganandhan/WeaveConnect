const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.use(authenticate);

const updateProfileValidation = [
  body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isString().trim(),
];

router.get('/', getProfile);
router.patch('/', updateProfileValidation, validateRequest, updateProfile);

module.exports = router;
