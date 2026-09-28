const router = require('express').Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const manufacturerRoutes = require('./manufacturerRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const reviewRoutes = require('./reviewRoutes');
const storeRoutes = require('./storeRoutes');
const profileRoutes = require('./profileRoutes');
const uploadRoutes = require('./uploadRoutes');

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/manufacturer', manufacturerRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/reviews', reviewRoutes);
router.use('/stores', storeRoutes);
router.use('/profile', profileRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
