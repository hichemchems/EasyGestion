const express = require('express');
const { body, validationResult } = require('express-validator');
const { Goal, Employee, Sale, Receipt } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Validation rules for goal creation
const goalValidation = [
  body('employee_id').isInt({ min: 1 }).withMessage('Valid employee ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  body('monthly_target').isFloat({ min: 0 }).withMessage('Monthly target must be a positive number'),
  body('daily_target').isFloat({ min: 0 }).withMessage('Daily target must be a positive number'),
  body('remaining_days').isInt({ min: 1, max: 31 }).withMessage('Remaining days must be between 1 and 31')
];

// Get all goals (admin only)
router.get('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const goals = await Goal.findAll({
      include: [{
        model: Employee,
        as: 'employee',
        include: [{
          model: require('../models').User,
          as: 'user',
          attributes: ['username', 'email']
        }]
      }],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    res.json({
      message: 'Goals retrieved successfully',
      goals
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get goal for specific employee and month/year
router.get('/:employeeId/:month/:year', authenticateToken, async (req, res) => {
  try {
    const { employeeId, month, year } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user can access this employee's goals
    if (userRole !== 'admin' && userRole !== 'superAdmin') {
      const employee = await Employee.findOne({ where: { id: employeeId, user_id: userId } });
      if (!employee) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const goal = await Goal.findOne({
      where: { employee_id: employeeId, month: parseInt(month), year: parseInt(year) },
      include: [{
        model: Employee,
        as: 'employee',
        include: [{
          model: require('../models').User,
          as: 'user',
          attributes: ['username', 'email']
        }]
      }]
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({
      message: 'Goal retrieved successfully',
      goal
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new goal (admin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), goalValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employee_id, month, year, monthly_target, daily_target, remaining_days } = req.body;

    // Check if goal already exists for this employee/month/year
    const existingGoal = await Goal.findOne({
      where: { employee_id, month, year }
    });

    if (existingGoal) {
      return res.status(400).json({ message: 'Goal already exists for this employee and period' });
    }

    // Calculate current monthly total from sales and receipts
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [salesTotal, receiptsTotal] = await Promise.all([
      Sale.sum('amount', {
        where: {
          employee_id,
          date: { [require('sequelize').Op.between]: [startDate, endDate] }
        }
      }) || 0,
      Receipt.sum('amount', {
        where: {
          employee_id,
          date: { [require('sequelize').Op.between]: [startDate, endDate] }
        }
      }) || 0
    ]);

    const currentMonthlyTotal = salesTotal + receiptsTotal;

    const goal = await Goal.create({
      employee_id,
      month,
      year,
      monthly_target,
      daily_target,
      current_monthly_total: currentMonthlyTotal,
      remaining_days
    });

    const createdGoal = await Goal.findByPk(goal.id, {
      include: [{
        model: Employee,
        as: 'employee',
        include: [{
          model: require('../models').User,
          as: 'user',
          attributes: ['username', 'email']
        }]
      }]
    });

    res.status(201).json({
      message: 'Goal created successfully',
      goal: createdGoal
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update goal (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), goalValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { monthly_target, daily_target, remaining_days, carry_over_amount } = req.body;

    const goal = await Goal.findByPk(id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await goal.update({
      monthly_target,
      daily_target,
      remaining_days,
      carry_over_amount: carry_over_amount || goal.carry_over_amount
    });

    const updatedGoal = await Goal.findByPk(id, {
      include: [{
        model: Employee,
        as: 'employee',
        include: [{
          model: require('../models').User,
          as: 'user',
          attributes: ['username', 'email']
        }]
      }]
    });

    res.json({
      message: 'Goal updated successfully',
      goal: updatedGoal
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete goal (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findByPk(id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await goal.destroy();

    res.json({
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update current monthly total for a goal (called when sales/receipts are added)
router.put('/:id/update-total', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findByPk(id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Recalculate current monthly total
    const startDate = new Date(goal.year, goal.month - 1, 1);
    const endDate = new Date(goal.year, goal.month, 0);

    const [salesTotal, receiptsTotal] = await Promise.all([
      Sale.sum('amount', {
        where: {
          employee_id: goal.employee_id,
          date: { [require('sequelize').Op.between]: [startDate, endDate] }
        }
      }) || 0,
      Receipt.sum('amount', {
        where: {
          employee_id: goal.employee_id,
          date: { [require('sequelize').Op.between]: [startDate, endDate] }
        }
      }) || 0
    ]);

    const newTotal = salesTotal + receiptsTotal;

    await goal.update({ current_monthly_total: newTotal });

    res.json({
      message: 'Goal total updated successfully',
      goal: {
        id: goal.id,
        current_monthly_total: newTotal
      }
    });
  } catch (error) {
    console.error('Update goal total error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
