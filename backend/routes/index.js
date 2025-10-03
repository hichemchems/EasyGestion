const express = require('express');
const router = express.Router();

// Route modules
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/employees', require('./employees'));
router.use('/packages', require('./packages'));
router.use('/receipts', require('./receipts'));
router.use('/expenses', require('./expenses'));
router.use('/admin', require('./admin'));
router.use('/adminCharges', require('./adminCharges'));
router.use('/alerts', require('./alerts'));
router.use('/analytics', require('./analytics'));
router.use('/salaries', require('./salaries'));

// Example route
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to EasyGestion API v1' });
});

module.exports = router;
