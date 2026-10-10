const { body } = require('express-validator');

// Checkout must arrive either as a list of items (fresh payment) or as an
// existing orderId (retry). Never as an amount — the server computes the
// amount itself from MongoDB prices.
const createPaymentOrderValidation = [
  body().custom((value) => {
    if (value && typeof value.orderId === 'string') return true;
    if (value && Array.isArray(value.items) && value.items.length > 0) return true;
    throw new Error('Provide items to checkout or an orderId to retry payment');
  }),
  body('orderId').optional().isMongoId().withMessage('Invalid order id'),
  body('items').optional().isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  // Required (not optional) so a payload like { items: [{ quantity: 2 }] }
  // fails validation with a clear message instead of a CastError deeper in.
  body('items.*.productId').if(body('items').exists()).isMongoId().withMessage('Please provide a valid product id'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be a positive integer'),
  body('shippingAddress').optional().isObject().withMessage('Shipping address must be an object'),
  body('shippingAddress.zip').optional().isString().trim(),
];

const verifyPaymentValidation = [
  body('orderId').isMongoId().withMessage('Invalid order id'),
  body('razorpayOrderId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Razorpay order id is required')
    .isLength({ max: 100 }),
  body('razorpayPaymentId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Razorpay payment id is required')
    .isLength({ max: 100 }),
  body('razorpaySignature')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Payment signature is required')
    .isLength({ max: 256 }),
];

const paymentFailureValidation = [
  body('orderId').isMongoId().withMessage('Invalid order id'),
];

module.exports = {
  createPaymentOrderValidation,
  verifyPaymentValidation,
  paymentFailureValidation,
};
