const express = require('express');
const router = express.Router();

// Import route modules here
const authRoutes = require('./auth');
const userRoutes = require('./users');
const packageRoutes = require('./packages');
// const salesRoutes = require('./sales');
// const analyticsRoutes = require('./analytics');
const adminRoutes = require('./admin');

// Example route
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to EasyGestion API v1' });
});

// Use route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/packages', packageRoutes);
// router.use('/sales', salesRoutes);
// router.use('/analytics', analyticsRoutes);
router.use('/admins', adminRoutes);

module.exports = router;
