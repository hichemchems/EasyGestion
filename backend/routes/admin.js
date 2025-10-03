const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
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
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('Validation passed');

    const { email, siret, phone, password, name } = req.body;

    // Allow multiple admins for testing

    // Check if user with email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Handle logo upload
    let logoPath = null;
    if (req.files && req.files.logo) {
      const logo = req.files.logo;

      // Create uploads/logos directory if it doesn't exist
      const uploadDir = path.join(__dirname, '../uploads/logos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const fileName = `logo_${Date.now()}_${logo.name}`;
      logoPath = path.join(uploadDir, fileName);

      // Move file
      await logo.mv(logoPath);
      logoPath = `/uploads/logos/${fileName}`; // Relative path for database
    }

    // Hash password
    const saltRounds = 8;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const admin = await User.create({
      username: name, // Use name as username
      email,
      password_hash,
      role: 'admin',
      siret,
      phone,
      logo_path: logoPath
    });

    // Generate token
    const token = generateToken(admin);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Admin created successfully',
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        siret: admin.siret,
        phone: admin.phone,
        logo_path: admin.logo_path
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all expenses (admin only)
router.get('/expenses', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
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

// Create expense (admin only)
router.post('/expenses', authenticateToken, authorizeRoles('admin', 'superAdmin'), expenseValidation, async (req, res) => {
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

// Get expense categories
router.get('/expenses/categories', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const categories = await Expense.findAll({
      attributes: [
        [require('sequelize').fn('DISTINCT', require('sequelize').col('category')), 'category']
      ],
      raw: true
    });

    const categoryList = categories.map(cat => cat.category);

    res.json({
      message: 'Expense categories retrieved successfully',
      categories: categoryList
    });
  } catch (error) {
    console.error('Get expense categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

// Get all salaries (admin only)
router.get('/salaries', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const salaries = await Salary.findAll({
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'name', 'position']
      }],
      order: [['period_start', 'DESC']]
    });

    res.json({
      message: 'Salaries retrieved successfully',
      salaries
    });
  } catch (error) {
    console.error('Get salaries error:', error);
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
