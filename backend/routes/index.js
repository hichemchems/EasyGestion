const express = require('express');
const router = express.Router();

console.log('Loading routes/index.js');

// Route modules
router.use('/auth', require('./auth'));
console.log('auth loaded');
router.use('/users', require('./users'));
console.log('users loaded');
router.use('/employees', require('./employees'));
console.log('employees loaded');
router.use('/packages', require('./packages'));
console.log('packages loaded');
router.use('/receipts', require('./receipts'));
console.log('receipts loaded');
router.use('/expenses', require('./expenses'));
console.log('expenses loaded');
router.use('/admin', require('./admin'));
console.log('admin loaded');
router.use('/adminCharges', require('./adminCharges'));
console.log('adminCharges loaded');
router.use('/alerts', require('./alerts'));
console.log('alerts loaded');
router.use('/analytics', require('./analytics'));
console.log('analytics loaded');
router.use('/salaries', require('./salaries'));
console.log('salaries loaded');
router.use('/goals', require('./goals'));
console.log('goals loaded');

// Example route
router.get('/', (req, res) => {
  console.log('API v1 root route called');
  res.json({ message: 'Welcome to EasyGestion API v1' });
});

console.log('Routes loaded successfully');

module.exports = router;
