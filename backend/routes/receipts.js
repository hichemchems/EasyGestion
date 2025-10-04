const express = require('express');
const { body, validationResult } = require('express-validator');
const { Receipt, Employee } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { io } = require('../index');

const router = express.Router();

// Validation rules for receipt creation
const receiptValidation = [
  body('client_name').isLength({ min: 1 }).withMessage('Client name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// Middleware to check if user can access employee data
const canAccessEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin/superAdmin can access any employee
    if (userRole === 'admin' || userRole === 'superAdmin') {
      return next();
    }

    // Users can only access their own employee data
    const employee = await Employee.findOne({ where: { id, user_id: userId } });
    if (!employee) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get receipts for employee
router.get('/:id/receipts', authenticateToken, canAccessEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    const receipts = await Receipt.findAll({
      where: { employee_id: id },
      order: [['date', 'DESC']]
    });

    res.json({
      message: 'Receipts retrieved successfully',
      receipts
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create receipt for employee
router.post('/:id/receipts', authenticateToken, canAccessEmployee, receiptValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { client_name, amount, description } = req.body;

    const receipt = await Receipt.create({
      employee_id: id,
      client_name,
      amount,
      description
    });

    // Emit real-time update
    io.emit('receipt-created', {
      employee_id: id,
      receipt: receipt
    });

    res.status(201).json({
      message: 'Receipt created successfully',
      receipt
    });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update receipt
router.put('/:id/receipts/:receiptId', authenticateToken, canAccessEmployee, receiptValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, receiptId } = req.params;
    const { client_name, amount, description } = req.body;

    // Check if receipt exists and belongs to employee
    const receipt = await Receipt.findOne({
      where: { id: receiptId, employee_id: id }
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    await receipt.update({
      client_name,
      amount,
      description
    });

    // Emit real-time update
    io.emit('receipt-updated', {
      employee_id: id,
      receipt: receipt
    });

    res.json({
      message: 'Receipt updated successfully',
      receipt
    });
  } catch (error) {
    console.error('Update receipt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete receipt
router.delete('/:id/receipts/:receiptId', authenticateToken, canAccessEmployee, async (req, res) => {
  try {
    const { id, receiptId } = req.params;

    // Check if receipt exists and belongs to employee
    const receipt = await Receipt.findOne({
      where: { id: receiptId, employee_id: id }
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    await receipt.destroy();

    // Emit real-time update
    io.emit('receipt-deleted', {
      employee_id: id,
      receipt_id: receiptId
    });

    res.json({
      message: 'Receipt deleted successfully'
    });
  } catch (error) {
    console.error('Delete receipt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
