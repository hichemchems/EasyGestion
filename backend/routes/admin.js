const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { User, Employee } = require('../models');

const router = express.Router();

// Validation rules for admin registration
const adminRegisterValidation = [
  body('name').isLength({ min: 1 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('siret').isLength({ min: 14, max: 14 }).withMessage('SIRET must be exactly 14 digits')
    .isNumeric().withMessage('SIRET must contain only numbers'),
  body('phone').isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('password').isLength({ min: 14 }).withMessage('Password must be at least 14 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
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
router.post('/', adminRegisterValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, siret, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Handle logo upload if provided
    let logoPath = null;
    if (req.files && req.files.logo) {
      const logo = req.files.logo;
      const uploadDir = path.join(__dirname, '../uploads/logos');

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const fileName = `admin_${Date.now()}_${logo.name}`;
      const filePath = path.join(uploadDir, fileName);

      // Move file to upload directory
      await logo.mv(filePath);
      logoPath = `/uploads/logos/${fileName}`;
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const user = await User.create({
      username: name, // Using name as username
      email,
      password_hash,
      role: 'admin',
      siret,
      phone,
      logo_path: logoPath
    });

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
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
router.post('/employees', employeeCreateValidation, async (req, res) => {
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
    if (req.files && req.files.avatar) {
      const avatar = req.files.avatar;
      const uploadDir = path.join(__dirname, '../uploads/avatars');

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const fileName = `avatar_${Date.now()}_${avatar.name}`;
      const filePath = path.join(uploadDir, fileName);

      // Move file to upload directory
      await avatar.mv(filePath);
      avatarPath = `/uploads/avatars/${fileName}`;
    }

    // Handle documents upload
    let documentPaths = [];
    if (req.files && req.files.documents) {
      const documents = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
      const uploadDir = path.join(__dirname, '../uploads/documents');

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const doc of documents) {
        const fileName = `doc_${Date.now()}_${doc.name}`;
        const filePath = path.join(uploadDir, fileName);
        await doc.mv(filePath);
        documentPaths.push(`/uploads/documents/${fileName}`);
      }
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      username: name,
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

module.exports = router;
