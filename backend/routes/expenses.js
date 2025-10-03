const express = require('express');
const { body, validationResult } = require('express-validator');
const { Expense } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Validation rules for expense creation
const expenseValidation = [
  body('category').isLength({ min: 1 }).withMessage('Category is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// Get all expenses
router.get('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { category, start_date, end_date } = req.query;

    const whereClause = {};
    if (category) {
      whereClause.category = category;
    }
    if (start_date && end_date) {
      whereClause.date = {
        [require('sequelize').Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      order: [['date', 'DESC']]
    });

    res.json({
      message: 'Expenses retrieved successfully',
      expenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create expense
router.post('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), expenseValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount, description } = req.body;
    const created_by = req.user.id;

    const expense = await Expense.create({
      category,
      amount,
      description,
      created_by
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update expense
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), expenseValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { category, amount, description } = req.body;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.update({
      category,
      amount,
      description
    });

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.destroy();

    res.json({
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
