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

// Helper function to get date range
const getDateRange = (period, date = new Date()) => {
  const start = new Date(date);
  const end = new Date(date);

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error('Invalid period');
  }

  return { start, end };
};

// Validation rules for admin creation
const adminCreationValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('siret').optional().isLength({ min: 14, max: 14 }).withMessage('SIRET must be exactly 14 digits'),
  body('phone').optional(),
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

// Validation rules for employee creation
const employeeCreationValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').isLength({ min: 2 }).withMessage('Name is required'),
  body('deduction_percentage').isFloat({ min: 0, max: 100 }).withMessage('Deduction percentage must be between 0 and 100')
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
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  try {
    console.log('Validating request');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('Validation passed');

    const { email, siret, phone, password, name } = req.body;
    console.log('Extracted data:', { email, siret, phone, password: '[HIDDEN]', name });

    // Check if user exists
    console.log('Checking if user exists');
    const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username: name }] } });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    console.log('User does not exist, proceeding');

    // Hash password
    console.log('Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed');

    // Create user
    console.log('Creating user');
    const user = await User.create({
      username: name,
      email,
      password_hash: hashedPassword,
      role: 'admin',
      siret,
      phone
    });
    console.log('User created:', user.id);

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

// Create employee endpoint
router.post('/employees', authenticateToken, authorizeRoles('admin', 'superAdmin'), employeeCreationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, password, name, deduction_percentage } = req.body;

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
      role: 'employee',
      phone
    });

    // Create employee
    const employee = await Employee.create({
      user_id: user.id,
      deduction_percentage: deduction_percentage || 0
    });

    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employee.id,
        user_id: user.id,
        name: user.username,
        email: user.email,
        phone: user.phone,
        deduction_percentage: employee.deduction_percentage
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
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

// Get sorted barbers for dashboard
router.get('/dashboard/sorted-barbers', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'email']
      }],
      attributes: ['id', 'deduction_percentage']
    });

    const barbersData = await Promise.all(employees.map(async (employee) => {
      const today = new Date();
      const { start: dailyStart, end: dailyEnd } = getDateRange('daily', today);
      const { start: weeklyStart, end: weeklyEnd } = getDateRange('weekly', today);
      const { start: monthlyStart, end: monthlyEnd } = getDateRange('monthly', today);

      const dailyReceipts = await Receipt.sum('amount', {
        where: {
          employee_id: employee.id,
          date: { [Op.between]: [dailyStart, dailyEnd] }
        }
      }) || 0;

      const weeklyReceipts = await Receipt.sum('amount', {
        where: {
          employee_id: employee.id,
          date: { [Op.between]: [weeklyStart, weeklyEnd] }
        }
      }) || 0;

      const monthlyReceipts = await Receipt.sum('amount', {
        where: {
          employee_id: employee.id,
          date: { [Op.between]: [monthlyStart, monthlyEnd] }
        }
      }) || 0;

      const totalTurnover = await Receipt.sum('amount', {
        where: { employee_id: employee.id }
      }) || 0;

      return {
        id: employee.id,
        name: employee.user.username,
        daily_receipts: parseFloat(dailyReceipts),
        weekly_receipts: parseFloat(weeklyReceipts),
        monthly_receipts: parseFloat(monthlyReceipts),
        turnover: parseFloat(totalTurnover),
        deduction_percentage: employee.deduction_percentage
      };
    }));

    res.json({
      message: 'Sorted barbers retrieved successfully',
      barbers: barbersData
    });
  } catch (error) {
    console.error('Get sorted barbers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get realtime charts data
router.get('/dashboard/realtime-charts', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();

    // Daily data for last 30 days
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const { start, end } = getDateRange('daily', date);

      const turnover = await Receipt.sum('amount', {
        where: {
          date: { [Op.between]: [start, end] }
        }
      }) || 0;

      dailyData.push({
        date: date.toISOString().split('T')[0],
        turnover: parseFloat(turnover)
      });
    }

    // Monthly data for current year
    const monthlyData = [];
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(currentYear, month, 1);
      const { start, end } = getDateRange('monthly', monthDate);

      const turnover = await Receipt.sum('amount', {
        where: {
          date: { [Op.between]: [start, end] }
        }
      }) || 0;

      monthlyData.push({
        month: monthDate.toLocaleString('default', { month: 'long' }),
        turnover: parseFloat(turnover)
      });
    }

    // Yearly data for last 5 years
    const yearlyData = [];
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

      const turnover = await Receipt.sum('amount', {
        where: {
          date: { [Op.between]: [yearStart, yearEnd] }
        }
      }) || 0;

      yearlyData.push({
        year: year.toString(),
        turnover: parseFloat(turnover)
      });
    }

    res.json({
      message: 'Realtime charts data retrieved successfully',
      daily: dailyData,
      monthly: monthlyData,
      yearly: yearlyData
    });
  } catch (error) {
    console.error('Get realtime charts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get forecast data
router.get('/dashboard/forecast', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const annualObjective = 50000; // Default objective, can be made configurable
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();

    const ytdTurnover = await Receipt.sum('amount', {
      where: {
        date: { [Op.between]: [startOfYear, now] }
      }
    }) || 0;

    const percentageAchieved = (parseFloat(ytdTurnover) / annualObjective) * 100;

    res.json({
      message: 'Forecast data retrieved successfully',
      percentage_achieved: percentageAchieved,
      annual_objective: annualObjective,
      ytd_turnover: parseFloat(ytdTurnover)
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
