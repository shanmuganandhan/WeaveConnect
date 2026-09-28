const { body } = require('express-validator');

const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Please provide a valid product id'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('shippingAddress')
    .optional()
    .isObject()
    .withMessage('Shipping address must be an object'),
  body('shippingAddress.name').optional().isString().trim(),
  body('shippingAddress.phone').optional().isString().trim(),
  body('shippingAddress.addressLine1').optional().isString().trim(),
  body('shippingAddress.addressLine2').optional().isString().trim(),
  body('shippingAddress.city').optional().isString().trim(),
  body('shippingAddress.state').optional().isString().trim(),
  body('shippingAddress.zip').optional().isString().trim(),
  body('paymentMethod')
    .optional()
    .isIn(['cod'])
    .withMessage('Payment method must be cod'),
];

const updateOrderStatusValidation = [
  body('status')
    .isIn(['pending', 'accepted', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
];

module.exports = { createOrderValidation, updateOrderStatusValidation };
