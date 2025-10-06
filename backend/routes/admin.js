const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { User, Expense, Salary, Employee, Sale, Receipt, AdminCharge } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

console.log('Admin routes loaded');

const router = express.Router();

// Validation rules for admin creation
const adminCreationValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('siret').isLength({ min: 14, max: 14 }).withMessage('SIRET must be exactly 14 digits')
    .isNumeric().withMessage('SIRET must contain only numbers'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('password').isLength({ min: 14 }).withMessage('Password must be at least 14 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('name').isLength({ min: 2 }).withMessage('Name is required')
];

// Validation rules for expense creation
const expenseValidation = [
  body('category').isLength({ min: 1 }).withMessage('Category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// Validation rules for salary creation
const salaryValidation = [
  body('employee_id').isInt({ min: 1 }).withMessage('Valid employee ID is required'),
  body('base_salary').isFloat({ min: 0 }).withMessage('Base salary must be a positive number'),
  body('commission_percentage').isFloat({ min: 0, max: 100 }).withMessage('Commission percentage must be between 0 and 100'),
  body('period_start').isISO8601().withMessage('Period start must be a valid date'),
  body('period_end').isISO8601().withMessage('Period end must be a valid date')
];

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Create admin endpoint
router.post('/', adminCreationValidation, async (req, res) => {
  console.log('Admin creation request received');
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, siret, phone, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username: name }] } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username: name,
      email,
      password_hash: hashedPassword,
      role: 'admin',
      siret,
      phone
    });

    // Handle logo
    if (req.files && req.files.logo) {
      const logo = req.files.logo;
      const uploadPath = path.join(__dirname, '../uploads', logo.name);
      fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
      await logo.mv(uploadPath);
      user.logo_path = uploadPath;
      await user.save();
    }

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Admin created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create expense (admin only)
router.post('/expenses', authenticateToken, authorizeRoles('admin', 'superAdmin'), expenseValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, amount, description } = req.body;

    const expense = await Expense.create({
      category,
      amount,
      description,
      created_by: req.user.id
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

// Update expense (admin only)
router.put('/expenses/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), expenseValidation, async (req, res) => {
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

// Delete expense (admin only)
router.delete('/expenses/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
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

// Create salary (admin only)
router.post('/salaries', authenticateToken, authorizeRoles('admin', 'superAdmin'), salaryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employee_id, base_salary, commission_percentage, period_start, period_end } = req.body;

    const salary = await Salary.create({
      employee_id,
      base_salary,
      commission_percentage,
      total_salary: base_salary + (base_salary * commission_percentage / 100),
      period_start,
      period_end
    });

    res.status(201).json({
      message: 'Salary created successfully',
      salary
    });
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update salary (admin only)
router.put('/salaries/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), salaryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { employee_id, base_salary, commission_percentage, period_start, period_end } = req.body;

    const salary = await Salary.findByPk(id);

    if (!salary) {
      return res.status(404).json({ message: 'Salary not found' });
    }

    await salary.update({
      employee_id,
      base_salary,
      commission_percentage,
      total_salary: base_salary + (base_salary * commission_percentage / 100),
      period_start,
      period_end
    });

    res.json({
      message: 'Salary updated successfully',
      salary
    });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete salary (admin only)
router.delete('/salaries/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await Salary.findByPk(id);

    if (!salary) {
      return res.status(404).json({ message: 'Salary not found' });
    }

    await salary.destroy();

    res.json({
      message: 'Salary deleted successfully'
    });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
