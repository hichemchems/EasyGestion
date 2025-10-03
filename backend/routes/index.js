const express = require('express');
const router = express.Router();

// Import route modules here
const authRoutes = require('./auth');
const userRoutes = require('./users');
const packageRoutes = require('./packages');
const employeeRoutes = require('./employees');
const receiptRoutes = require('./receipts');
const analyticsRoutes = require('./analytics');
const adminRoutes = require('./admin');
const adminChargesRoutes = require('./adminCharges');
const expensesRoutes = require('./expenses');
const salariesRoutes = require('./salaries');
const goalsRoutes = require('./goals');
const alertsRoutes = require('./alerts');

// Example route
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to EasyGestion API v1' });
});

// Use route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/packages', packageRoutes);
router.use('/employees', employeeRoutes);
router.use('/receipts', receiptRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admins', adminRoutes);
router.use('/admin-charges', adminChargesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/salaries', salariesRoutes);
router.use('/goals', goalsRoutes);
router.use('/alerts', alertsRoutes);

module.exports = router;
