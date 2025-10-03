const express = require('express');
const { Alert, Employee } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get alerts for current user (employee)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let employeeId;

    if (userRole === 'admin' || userRole === 'superAdmin') {
      // Admin can see all alerts, but we'll filter by query param if provided
      const { employee_id } = req.query;
      employeeId = employee_id;
    } else {
      // Regular users can only see their own alerts
      const employee = await Employee.findOne({ where: { user_id: userId } });
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      employeeId = employee.id;
    }

    const whereClause = employeeId ? { employee_id: employeeId } : {};

    const alerts = await Alert.findAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        include: [{
          model: require('../models').User,
          as: 'user',
          attributes: ['username', 'email']
        }]
      }],
      order: [['sent_at', 'DESC']]
    });

    res.json({
      message: 'Alerts retrieved successfully',
      alerts
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get unread alerts count for current user
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let employeeId;

    if (userRole === 'admin' || userRole === 'superAdmin') {
      const { employee_id } = req.query;
      employeeId = employee_id;
    } else {
      const employee = await Employee.findOne({ where: { user_id: userId } });
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      employeeId = employee.id;
    }

    const whereClause = {
      is_read: false,
      ...(employeeId && { employee_id: employeeId })
    };

    const count = await Alert.count({ where: whereClause });

    res.json({
      message: 'Unread alerts count retrieved successfully',
      count
    });
  } catch (error) {
    console.error('Get unread alerts count error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark alert as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const alert = await Alert.findByPk(id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Check if user can access this alert
    if (userRole !== 'admin' && userRole !== 'superAdmin') {
      const employee = await Employee.findOne({ where: { id: alert.employee_id, user_id: userId } });
      if (!employee) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await alert.update({ is_read: true });

    res.json({
      message: 'Alert marked as read successfully'
    });
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all alerts as read for current user
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let employeeId;

    if (userRole === 'admin' || userRole === 'superAdmin') {
      const { employee_id } = req.query;
      employeeId = employee_id;
    } else {
      const employee = await Employee.findOne({ where: { user_id: userId } });
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      employeeId = employee.id;
    }

    const whereClause = {
      is_read: false,
      ...(employeeId && { employee_id: employeeId })
    };

    const [affectedRows] = await Alert.update(
      { is_read: true },
      { where: whereClause }
    );

    res.json({
      message: `${affectedRows} alerts marked as read successfully`
    });
  } catch (error) {
    console.error('Mark all alerts as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create alert (admin only - for testing or manual alerts)
router.post('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), [
  require('express-validator').body('employee_id').isInt({ min: 1 }).withMessage('Valid employee ID is required'),
  require('express-validator').body('type').isIn(['daily_objective', 'monthly_objective', 'goal_carryover']).withMessage('Invalid alert type'),
  require('express-validator').body('message').isLength({ min: 1 }).withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employee_id, type, message, data } = req.body;

    const alert = await Alert.create({
      employee_id,
      type,
      message,
      data
    });

    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
