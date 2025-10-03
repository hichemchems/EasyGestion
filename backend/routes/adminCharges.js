const express = require('express');
const { body, validationResult } = require('express-validator');
const { AdminCharge } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get current admin charges
router.get('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const charges = await AdminCharge.findAll();
    res.json({
      message: 'Admin charges retrieved successfully',
      charges
    });
  } catch (error) {
    console.error('Get admin charges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create or update admin charges
router.post('/', authenticateToken, authorizeRoles('admin', 'superAdmin'), [
  body('rent').isFloat({ min: 0 }).withMessage('Rent must be a positive number'),
  body('charges').isFloat({ min: 0 }).withMessage('Charges must be a positive number'),
  body('operating_costs').isFloat({ min: 0 }).withMessage('Operating costs must be a positive number'),
  body('electricity').isFloat({ min: 0 }).withMessage('Electricity must be a positive number'),
  body('salaries').isFloat({ min: 0 }).withMessage('Salaries must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rent, charges, operating_costs, electricity, salaries } = req.body;

    // Check if charges exist
    let adminCharge = await AdminCharge.findOne();
    if (adminCharge) {
      await adminCharge.update({ rent, charges, operating_costs, electricity, salaries });
    } else {
      adminCharge = await AdminCharge.create({ rent, charges, operating_costs, electricity, salaries });
    }

    res.json({
      message: 'Admin charges saved successfully',
      adminCharge
    });
  } catch (error) {
    console.error('Save admin charges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get daily alerts with objectives and remaining amounts
router.get('/alerts', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    // Get current admin charges
    const adminCharges = await AdminCharge.findOne();
    const totalCharges = adminCharges ? (
      parseFloat(adminCharges.rent || 0) +
      parseFloat(adminCharges.charges || 0) +
      parseFloat(adminCharges.operating_costs || 0) +
      parseFloat(adminCharges.electricity || 0) +
      parseFloat(adminCharges.salaries || 0)
    ) : 0;

    // Get today's turnover
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const salesTotal = await require('../models').Sale.sum('amount', {
      where: { date: { [require('sequelize').Op.between]: [startOfDay, endOfDay] } }
    }) || 0;

    const receiptsTotal = await require('../models').Receipt.sum('amount', {
      where: { date: { [require('sequelize').Op.between]: [startOfDay, endOfDay] } }
    }) || 0;

    const dailyTurnover = parseFloat(salesTotal) + parseFloat(receiptsTotal);

    // Get monthly objective (assume 50000 annual / 12)
    const monthlyObjective = 50000 / 12;
    const currentMonth = new Date().getMonth();
    const startOfMonth = new Date(today.getFullYear(), currentMonth, 1);
    const endOfMonth = new Date(today.getFullYear(), currentMonth + 1, 0, 23, 59, 59, 999);

    const monthlySales = await require('../models').Sale.sum('amount', {
      where: { date: { [require('sequelize').Op.between]: [startOfMonth, endOfMonth] } }
    }) || 0;

    const monthlyReceipts = await require('../models').Receipt.sum('amount', {
      where: { date: { [require('sequelize').Op.between]: [startOfMonth, endOfMonth] } }
    }) || 0;

    const monthlyTurnover = parseFloat(monthlySales) + parseFloat(monthlyReceipts);
    const remainingToObjective = Math.max(0, monthlyObjective - monthlyTurnover);

    // Calculate days left in month
    const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
    const daysPassed = today.getDate();
    const daysLeft = daysInMonth - daysPassed;

    res.json({
      message: 'Daily alerts retrieved successfully',
      date: today.toISOString().split('T')[0],
      daily_turnover: dailyTurnover,
      monthly_turnover: monthlyTurnover,
      monthly_objective: monthlyObjective,
      remaining_to_objective: remainingToObjective,
      days_left_in_month: daysLeft,
      average_daily_needed: daysLeft > 0 ? remainingToObjective / daysLeft : 0,
      total_charges: totalCharges
    });
  } catch (error) {
    console.error('Get daily alerts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
