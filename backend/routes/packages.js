const express = require('express');
const { body, validationResult } = require('express-validator');
const { Package } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const packageValidation = [
  body('name').isLength({ min: 1 }).withMessage('Package name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

// Get all active packages
router.get('/', async (req, res) => {
  try {
    const packages = await Package.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });

    res.json({
      message: 'Packages retrieved successfully',
      packages
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all packages (admin only)
router.get('/admin', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const packages = await Package.findAll({
      order: [['created_at', 'DESC']]
    });

    res.json({
      message: 'All packages retrieved successfully',
      packages
    });
  } catch (error) {
    console.error('Get all packages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get package by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await Package.findByPk(id);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({
      message: 'Package retrieved successfully',
      package: pkg
    });
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new package (admin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), packageValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, price, is_active = true } = req.body;

    const pkg = await Package.create({
      name,
      price,
      is_active
    });

    res.status(201).json({
      message: 'Package created successfully',
      package: pkg
    });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update package (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), packageValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, price, is_active } = req.body;

    const pkg = await Package.findByPk(id);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    await pkg.update({
      name,
      price,
      is_active
    });

    res.json({
      message: 'Package updated successfully',
      package: pkg
    });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Deactivate package (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await Package.findByPk(id);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    await pkg.update({ is_active: false });

    res.json({
      message: 'Package deactivated successfully'
    });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
