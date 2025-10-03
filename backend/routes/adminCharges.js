const express = require('express');
const { body, validationResult } = require('express-validator');
const { AdminCharge } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get current admin charges
router.get('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const charges = await AdminCharge.findAll();
    res.json({
      message: 'Admin charges retrieved successfully',
      charges
    });
  } catch (error) {
    console.error('Get admin charges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create or update admin charges
router.post('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), [
  body('rent').isFloat({ min: 0 }).withMessage('Rent must be a positive number'),
  body('charges').isFloat({ min: 0 }).withMessage('Charges must be a positive number'),
  body('operating_costs').isFloat({ min: 0 }).withMessage('Operating costs must be a positive number'),
  body('electricity').isFloat({ min: 0 }).withMessage('Electricity must be a positive number'),
  body('salaries').isFloat({ min: 0 }).withMessage('Salaries must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rent, charges, operating_costs, electricity, salaries } = req.body;

    // Check if charges exist
    let adminCharge = await AdminCharge.findOne();
    if (adminCharge) {
      await adminCharge.update({ rent, charges, operating_costs, electricity, salaries });
    } else {
      adminCharge = await AdminCharge.create({ rent, charges, operating_costs, electricity, salaries });
    }

    res.json({
      message: 'Admin charges saved successfully',
      adminCharge
    });
  } catch (error) {
    console.error('Save admin charges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
