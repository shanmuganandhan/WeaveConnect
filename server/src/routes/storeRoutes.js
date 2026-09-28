const express = require('express');
const { getStoreProfile } = require('../controllers/storeController');

const router = express.Router();

// Public storefront routes. No login is needed to look at a seller's store.
router.get('/:id', getStoreProfile);

module.exports = router;
