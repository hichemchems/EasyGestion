const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');

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

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { role: ['admin', 'superAdmin'] }
    });

    if (existingAdmin) {
      return res.status(400).json({ message: 'An admin already exists. Use the registration endpoint for additional users.' });
    }

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

module.exports = router;
