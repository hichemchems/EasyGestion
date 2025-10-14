const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { User, Employee } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Validation rules for user creation
const userCreationValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 14 }).withMessage('Password must be at least 14 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('name').isLength({ min: 2 }).withMessage('Name is required'),
  body('position').isLength({ min: 2 }).withMessage('Position is required'),
  body('hire_date').isISO8601().withMessage('Hire date must be a valid date'),
  body('deduction_percentage').isFloat({ min: 0, max: 100 }).withMessage('Deduction percentage must be between 0 and 100')
];

// Get all users (admin/superAdmin only)
router.get('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Employee,
        as: 'Employee',
        attributes: ['id', 'user_id', 'first_name', 'last_name', 'email', 'phone', 'position', 'salary', 'hire_date', 'status', 'file_path', 'deduction_percentage', 'created_at', 'updated_at']
      }],
      attributes: { exclude: ['password_hash'] }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create user (barber) (admin/superAdmin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), userCreationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, position, hire_date, deduction_percentage } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Handle file uploads
    let avatarPath = null;
    let contractPath = null;
    let employmentDeclarationPath = null;
    let certificationPath = null;

    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const avatarsDir = path.join(uploadDir, 'avatars');
    const documentsDir = path.join(uploadDir, 'documents');

    if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
    if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });

    if (req.files) {
      // Avatar
      if (req.files.avatar) {
        const avatar = req.files.avatar;
        const fileName = `avatar_${Date.now()}_${avatar.name}`;
        avatarPath = path.join(avatarsDir, fileName);
        await avatar.mv(avatarPath);
        avatarPath = `/uploads/avatars/${fileName}`;
      }

      // Documents
      const documentFields = ['contract', 'employment_declaration', 'certification'];
      const documentPaths = [contractPath, employmentDeclarationPath, certificationPath];

      for (let i = 0; i < documentFields.length; i++) {
        if (req.files[documentFields[i]]) {
          const doc = req.files[documentFields[i]];
          const fileName = `${documentFields[i]}_${Date.now()}_${doc.name}`;
          const filePath = path.join(documentsDir, fileName);
          await doc.mv(filePath);
          documentPaths[i] = `/uploads/documents/${fileName}`;
        }
      }

      [contractPath, employmentDeclarationPath, certificationPath] = documentPaths;
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      username: name,
      email,
      password_hash,
      role: 'user'
    });

    // Create employee
    const employee = await Employee.create({
      user_id: user.id,
      name,
      position,
      hire_date,
      deduction_percentage
    });

    // Add certification to user if needed, but for now skip

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        employee: {
          id: employee.id,
          name: employee.name,
          position: employee.position,
          hire_date: employee.hire_date,
          deduction_percentage: employee.deduction_percentage
        }
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user (admin/superAdmin only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove password from updates if present
    delete updates.password;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update(updates);

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user (admin/superAdmin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{ model: Employee, as: 'Employee' }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete employee first
    if (user.Employee) {
      await user.Employee.destroy();
    }

    // Delete user
    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update employee deduction percentage (admin/superAdmin only)
router.put('/:userId/deduction-percentage', authenticateToken, authorizeRoles('admin', 'superAdmin'), [
  body('deduction_percentage').isFloat({ min: 0, max: 100 }).withMessage('Deduction percentage must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { deduction_percentage } = req.body;

    const employee = await Employee.findOne({ where: { user_id: userId } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.update({ deduction_percentage });

    res.json({
      message: 'Deduction percentage updated successfully',
      employee: {
        id: employee.id,
        deduction_percentage: employee.deduction_percentage
      }
    });
  } catch (error) {
    console.error('Update deduction percentage error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
