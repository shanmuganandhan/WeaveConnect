const { body } = require('express-validator');

const updateSettingsValidation = [
  body('orderFlow').optional().isString().withMessage('Order flow must be text').trim(),
  body('autoAccept').optional().isBoolean().withMessage('autoAccept must be a boolean'),
  body('approvalRequired').optional().isBoolean().withMessage('approvalRequired must be a boolean'),
  body('maxProducts').optional().isString().withMessage('Max products must be text').trim(),
  body('commission').optional().isString().withMessage('Commission must be text').trim(),
  body('payoutCycle').optional().isString().withMessage('Payout cycle must be text').trim(),
];

module.exports = { updateSettingsValidation };