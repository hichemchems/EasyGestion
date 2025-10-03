const express = require('express');
const { body, validationResult } = require('express-validator');
const { AdminCharge } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const adminChargeValidation = [
  body('rent').isFloat({ min: 0 }).withMessage('Rent must be a positive number'),
  body('charges').isFloat({ min: 0 }).withMessage('Charges must be a positive number'),
  body('operating_costs').isFloat({ min: 0 }).withMessage('Operating costs must be a positive number'),
  body('electricity').isFloat({ min: 0 }).withMessage('Electricity must be a positive number'),
  body('salaries').isFloat({ min: 0 }).withMessage('Salaries must be a positive number'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000 }).withMessage('Year must be a valid year')
];

// Get all admin charges
router.get('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const charges = await AdminCharge.findAll({
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    res.json({
      message: 'Admin charges retrieved successfully',
      charges
    });
  } catch (error) {
    console.error('Get admin charges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create admin charge
router.post('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), adminChargeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rent, charges, operating_costs, electricity, salaries, month, year } = req.body;

    // Check if record for month/year exists
    const existing = await AdminCharge.findOne({ where: { month, year } });
    if (existing) {
      return res.status(400).json({ message: 'Admin charges for this month and year already exist' });
    }

    const adminCharge = await AdminCharge.create({
      rent,
      charges,
      operating_costs,
      electricity,
      salaries,
      month,
      year
    });

    res.status(201).json({
      message: 'Admin charges created successfully',
      adminCharge
    });
  } catch (error) {
    console.error('Create admin charges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update admin charge
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), adminChargeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { rent, charges, operating_costs, electricity, salaries, month, year } = req.body;

    const adminCharge = await AdminCharge.findByPk(id);
    if (!adminCharge) {
      return res.status(404).json({ message: 'Admin charges not found' });
    }

    await adminCharge.update({
      rent,
      charges,
      operating_costs,
      electricity,
      salaries,
      month,
      year
    });

    res.json({
      message: 'Admin charges updated successfully',
      adminCharge
    });
  } catch (error) {
    console.error('Update admin charges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete admin charge
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const adminCharge = await AdminCharge.findByPk(id);
    if (!adminCharge) {
      return res.status(404).json({ message: 'Admin charges not found' });
    }

    await adminCharge.destroy();

    res.json({
      message: 'Admin charges deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin charges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
