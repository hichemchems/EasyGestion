const express = require('express');
const { Op } = require('sequelize');
const { Sale, Receipt, Expense, Employee, Package } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

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

// Get turnover data (sales + receipts)
router.get('/turnover', authenticateToken, async (req, res) => {
  try {
    const { period = 'monthly', date, employee_id } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const { start, end } = getDateRange(period, targetDate);

    const whereClause = {
      date: {
        [Op.between]: [start, end]
      }
    };

    if (employee_id) {
      whereClause.employee_id = employee_id;
    }

    // Get sales turnover
    const sales = await Sale.findAll({
      where: whereClause,
      include: [{
        model: Package,
        as: 'package',
        attributes: ['name', 'price']
      }],
      attributes: ['id', 'amount', 'date', 'employee_id']
    });

    // Get receipts turnover
    const receipts = await Receipt.findAll({
      where: whereClause,
      attributes: ['id', 'amount', 'date', 'employee_id']
    });

    // Calculate totals
    const salesTotal = sales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0);
    const receiptsTotal = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.amount), 0);
    const totalTurnover = salesTotal + receiptsTotal;

    res.json({
      message: 'Turnover data retrieved successfully',
      period,
      date_range: { start, end },
      turnover: {
        sales: salesTotal,
        receipts: receiptsTotal,
        total: totalTurnover
      },
      transactions: {
        sales: sales.length,
        receipts: receipts.length,
        total: sales.length + receipts.length
      },
      details: {
        sales,
        receipts
      }
    });
  } catch (error) {
    console.error('Get turnover error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get monthly evolution (turnover over time)
router.get('/evolution', authenticateToken, async (req, res) => {
  try {
    const { months = 12, employee_id } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - parseInt(months) + 1);

    const monthlyData = [];

    for (let i = 0; i < parseInt(months); i++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + i);

      const { start, end } = getDateRange('monthly', currentDate);

      const whereClause = {
        date: {
          [Op.between]: [start, end]
        }
      };

      if (employee_id) {
        whereClause.employee_id = employee_id;
      }

      const salesTotal = await Sale.sum('amount', { where: whereClause }) || 0;
      const receiptsTotal = await Receipt.sum('amount', { where: whereClause }) || 0;

      monthlyData.push({
        month: currentDate.toISOString().slice(0, 7), // YYYY-MM format
        sales: parseFloat(salesTotal),
        receipts: parseFloat(receiptsTotal),
        total: parseFloat(salesTotal) + parseFloat(receiptsTotal)
      });
    }

    res.json({
      message: 'Monthly evolution data retrieved successfully',
      months: parseInt(months),
      data: monthlyData
    });
  } catch (error) {
    console.error('Get evolution error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get profit calculation (turnover - expenses)
router.get('/profit', authenticateToken, async (req, res) => {
  try {
    const { period = 'monthly', date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const { start, end } = getDateRange(period, targetDate);

    // Get turnover
    const salesTotal = await Sale.sum('amount', {
      where: {
        date: { [Op.between]: [start, end] }
      }
    }) || 0;

    const receiptsTotal = await Receipt.sum('amount', {
      where: {
        date: { [Op.between]: [start, end] }
      }
    }) || 0;

    const totalTurnover = parseFloat(salesTotal) + parseFloat(receiptsTotal);

    // Get expenses
    const totalExpenses = await Expense.sum('amount', {
      where: {
        date: { [Op.between]: [start, end] }
      }
    }) || 0;

    const profit = totalTurnover - parseFloat(totalExpenses);

    res.json({
      message: 'Profit data retrieved successfully',
      period,
      date_range: { start, end },
      turnover: totalTurnover,
      expenses: parseFloat(totalExpenses),
      profit
    });
  } catch (error) {
    console.error('Get profit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get employee performance data
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const { period = 'monthly', date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const { start, end } = getDateRange(period, targetDate);

    const employees = await Employee.findAll({
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['username', 'email']
      }]
    });

    const performanceData = await Promise.all(employees.map(async (employee) => {
      const salesTotal = await Sale.sum('amount', {
        where: {
          employee_id: employee.id,
          date: { [Op.between]: [start, end] }
        }
      }) || 0;

      const receiptsTotal = await Receipt.sum('amount', {
        where: {
          employee_id: employee.id,
          date: { [Op.between]: [start, end] }
        }
      }) || 0;

      const totalTurnover = parseFloat(salesTotal) + parseFloat(receiptsTotal);

      return {
        employee_id: employee.id,
        employee_name: employee.name,
        username: employee.user.username,
        sales: parseFloat(salesTotal),
        receipts: parseFloat(receiptsTotal),
        total_turnover: totalTurnover,
        deduction_percentage: employee.deduction_percentage,
        net_turnover: totalTurnover * (1 - employee.deduction_percentage / 100)
      };
    }));

    res.json({
      message: 'Employee performance data retrieved successfully',
      period,
      date_range: { start, end },
      employees: performanceData
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
