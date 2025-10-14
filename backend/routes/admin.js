const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Op } = require('sequelize');
const { User, Employee, Receipt } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Handle OPTIONS for CORS preflight
router.options('/', (req, res) => {
  res.sendStatus(200);
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes working' });
});

// Validation rules for admin registration
const adminRegisterValidation = [
  body('name').isLength({ min: 1 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('siret').isLength({ min: 14, max: 14 }).withMessage('SIRET must be exactly 14 digits')
    .isNumeric().withMessage('SIRET must contain only numbers'),
  body('phone').isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('password').isLength({ min: 14 }).withMessage('Password must be at least 14 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword').custom((value, { req }) => { if (value !== req.body.password) { throw new Error('Password confirmation does not match password'); } return true; })
];

// Validation rules for employee creation
const employeeCreateValidation = [
  body('name').isLength({ min: 1 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('position').isIn(['Barber', 'Assistant', 'Manager']).withMessage('Invalid position'),
  body('hire_date').isISO8601().withMessage('Invalid hire date'),
  body('deduction_percentage').isFloat({ min: 0, max: 100 }).withMessage('Deduction percentage must be between 0 and 100'),
  body('password').isLength({ min: 14 }).withMessage('Password must be at least 14 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Admin registration endpoint
router.post('/', upload.fields([{ name: 'logo', maxCount: 1 }]), adminRegisterValidation, async (req, res) => {
  console.log('Admin registration request received');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request body confirmPassword:', req.body.confirmPassword);
  try {
    console.log('Starting validation check');
    const errors = validationResult(req);
    console.log('Validation errors:', errors.array());
    if (!errors.isEmpty()) {
      console.log('Validation failed, returning errors');
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('Validation passed');

    const { name, email, siret, phone, password } = req.body;
    console.log('Extracted user data: name, email, siret, phone, password (hidden)');

    // Check if user already exists
    console.log('Checking if user already exists with email:', email);
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists, registration failed');
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    console.log('User does not exist, proceeding with registration');

    // Handle logo upload if provided
    let logoPath = null;
    const logoFile = req.files && req.files.logo ? req.files.logo[0] : null;
    if (logoFile) {
      console.log('Logo file provided, processing upload');
      const uploadDir = path.join(__dirname, '../uploads/logos');

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Created uploads/logos directory');
      }

      // Generate unique filename
      const fileName = `admin_${Date.now()}_${logoFile.originalname}`;
      const filePath = path.join(uploadDir, fileName);

      // Move file from multer dest to logos directory
      fs.renameSync(path.join(__dirname, '../', logoFile.path), filePath);
      logoPath = `/uploads/logos/${fileName}`;
      console.log('Logo uploaded successfully, path:', logoPath);
    } else {
      console.log('No logo provided, skipping upload');
    }

    // Hash password
    console.log('Hashing password');
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create admin user
    console.log('Creating admin user in database');
    const user = await User.create({
      username: email, // Using email as username for uniqueness
      name, // Store display name separately
      email,
      password_hash,
      role: 'admin',
      siret,
      phone,
      logo_path: logoPath
    });
    console.log('Admin user created successfully, user ID:', user.id);

    // Generate token
    console.log('Generating JWT token');
    const token = generateToken(user);
    console.log('JWT token generated successfully');

    // Set cookie
    console.log('Setting authentication cookie');
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    console.log('Authentication cookie set');

    console.log('Admin registration completed successfully');
    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        siret: user.siret,
        phone: user.phone,
        logo_path: user.logo_path
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get admin route (existing)
router.get('/', (req, res) => {
  res.json({ message: 'Admin route working' });
});

// Create employee
router.post('/employees', upload.any(), employeeCreateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, position, hire_date, deduction_percentage } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Handle avatar upload if provided
    let avatarPath = null;
    const avatarFile = req.files ? req.files.find(f => f.fieldname === 'avatar') : null;
    if (avatarFile) {
      const uploadDir = path.join(__dirname, '../uploads/avatars');

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const fileName = `avatar_${Date.now()}_${avatarFile.originalname}`;
      const filePath = path.join(uploadDir, fileName);

      // Move file from multer dest to avatars directory
      fs.renameSync(path.join(__dirname, '../', avatarFile.path), filePath);
      avatarPath = `/uploads/avatars/${fileName}`;
    }

    // Handle documents upload
    let documentPaths = [];
    const docFiles = req.files ? req.files.filter(f => f.fieldname === 'documents') : [];
    if (docFiles.length > 0) {
      const uploadDir = path.join(__dirname, '../uploads/documents');

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const doc of docFiles) {
        const fileName = `doc_${Date.now()}_${doc.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        fs.renameSync(path.join(__dirname, '../', doc.path), filePath);
        documentPaths.push(`/uploads/documents/${fileName}`);
      }
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      username: email, // Using email as username for uniqueness
      name, // Store display name separately
      email,
      password_hash,
      role: 'user' // Employees are users
    });

    // Create employee
    const employee = await Employee.create({
      user_id: user.id,
      name,
      position,
      hire_date,
      deduction_percentage
    });

    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employee.id,
        user_id: user.id,
        name: employee.name,
        email: user.email,
        position: employee.position,
        hire_date: employee.hire_date,
        deduction_percentage: employee.deduction_percentage,
        avatar_path: avatarPath,
        document_paths: documentPaths
      }
    });
  } catch (error) {
    console.error('Employee creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get sorted barbers for dashboard
router.get('/dashboard/sorted-barbers', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'email']
      }],
      order: [['name', 'ASC']]
    });

    // Calculate turnover for each employee (simplified - you may want to add actual calculations)
    const barbersWithTurnover = await Promise.all(employees.map(async (employee) => {
      // Get today's receipts
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const dailyReceipts = await Receipt.sum('amount', {
        where: {
          employee_id: employee.id,
          date: { [Op.between]: [startOfDay, endOfDay] }
        }
      }) || 0;

      // Get this week's receipts
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weeklyReceipts = await Receipt.sum('amount', {
        where: {
          employee_id: employee.id,
          date: { [Op.between]: [startOfWeek, endOfWeek] }
        }
      }) || 0;

      // Get this month's receipts
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthlyReceipts = await Receipt.sum('amount', {
        where: {
          employee_id: employee.id,
          date: { [Op.between]: [startOfMonth, endOfMonth] }
        }
      }) || 0;

      // Calculate turnover (assuming turnover = receipts for simplicity)
      const turnover = monthlyReceipts;

      return {
        id: employee.id,
        name: employee.name,
        position: employee.position,
        deduction_percentage: employee.deduction_percentage,
        daily_receipts: parseFloat(dailyReceipts),
        weekly_receipts: parseFloat(weeklyReceipts),
        monthly_receipts: parseFloat(monthlyReceipts),
        turnover: parseFloat(turnover)
      };
    }));

    res.json({
      message: 'Barbers retrieved successfully',
      barbers: barbersWithTurnover
    });
  } catch (error) {
    console.error('Get sorted barbers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get realtime charts data
router.get('/dashboard/realtime-charts', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Get last 7 days data
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const turnover = await Receipt.sum('amount', {
        where: {
          date: { [Op.between]: [startOfDay, endOfDay] }
        }
      }) || 0;

      daily.push({
        date: date.toISOString().split('T')[0],
        turnover: parseFloat(turnover)
      });
    }

    // Get last 12 months data
    const monthly = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const turnover = await Receipt.sum('amount', {
        where: {
          date: { [Op.between]: [startOfMonth, endOfMonth] }
        }
      }) || 0;

      monthly.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        turnover: parseFloat(turnover)
      });
    }

    // Get last 5 years data
    const yearly = [];
    for (let i = 4; i >= 0; i--) {
      const year = new Date().getFullYear() - i;
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const turnover = await Receipt.sum('amount', {
        where: {
          date: { [Op.between]: [startOfYear, endOfYear] }
        }
      }) || 0;

      yearly.push({
        year: year.toString(),
        turnover: parseFloat(turnover)
      });
    }

    res.json({
      message: 'Realtime charts data retrieved successfully',
      daily,
      monthly,
      yearly
    });
  } catch (error) {
    console.error('Get realtime charts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get forecast data
router.get('/dashboard/forecast', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();

    const ytdTurnover = await Receipt.sum('amount', {
      where: {
        date: { [Op.between]: [startOfYear, now] }
      }
    }) || 0;

    const annualObjective = 50000; // You can make this configurable
    const percentageAchieved = (parseFloat(ytdTurnover) / annualObjective) * 100;

    res.json({
      message: 'Forecast data retrieved successfully',
      ytd_turnover: parseFloat(ytdTurnover),
      annual_objective: annualObjective,
      percentage_achieved: percentageAchieved
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
