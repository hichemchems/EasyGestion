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

// Get daily turnover
router.get('/daily-turnover', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const { start, end } = getDateRange('daily', targetDate);

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

    res.json({
      message: 'Daily turnover retrieved successfully',
      date: targetDate.toISOString().split('T')[0],
      turnover: totalTurnover,
      sales: parseFloat(salesTotal),
      receipts: parseFloat(receiptsTotal)
    });
  } catch (error) {
    console.error('Get daily turnover error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get weekly turnover
router.get('/weekly-turnover', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const { start, end } = getDateRange('weekly', targetDate);

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

    res.json({
      message: 'Weekly turnover retrieved successfully',
      week_start: start.toISOString().split('T')[0],
      week_end: end.toISOString().split('T')[0],
      turnover: totalTurnover,
      sales: parseFloat(salesTotal),
      receipts: parseFloat(receiptsTotal)
    });
  } catch (error) {
    console.error('Get weekly turnover error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get monthly turnover (cumulative since start of month)
router.get('/monthly-turnover', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const { start, end } = getDateRange('monthly', targetDate);

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

    res.json({
      message: 'Monthly turnover retrieved successfully',
      month: targetDate.toISOString().slice(0, 7),
      cumulative_turnover: totalTurnover,
      sales: parseFloat(salesTotal),
      receipts: parseFloat(receiptsTotal)
    });
  } catch (error) {
    console.error('Get monthly turnover error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get annual turnover (day by day and month by month)
router.get('/annual-turnover', authenticateToken, async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // Monthly data
    const monthlyData = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(targetYear, month, 1);
      const monthEnd = new Date(targetYear, month + 1, 0, 23, 59, 59, 999);

      const salesTotal = await Sale.sum('amount', {
        where: {
          date: { [Op.between]: [monthStart, monthEnd] }
        }
      }) || 0;

      const receiptsTotal = await Receipt.sum('amount', {
        where: {
          date: { [Op.between]: [monthStart, monthEnd] }
        }
      }) || 0;

      monthlyData.push({
        month: `${targetYear}-${String(month + 1).padStart(2, '0')}`,
        turnover: parseFloat(salesTotal) + parseFloat(receiptsTotal),
        sales: parseFloat(salesTotal),
        receipts: parseFloat(receiptsTotal)
      });
    }

    // Daily data for current year
    const dailyData = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const salesTotal = await Sale.sum('amount', {
        where: {
          date: { [Op.between]: [dayStart, dayEnd] }
        }
      }) || 0;

      const receiptsTotal = await Receipt.sum('amount', {
        where: {
          date: { [Op.between]: [dayStart, dayEnd] }
        }
      }) || 0;

      dailyData.push({
        date: currentDate.toISOString().split('T')[0],
        turnover: parseFloat(salesTotal) + parseFloat(receiptsTotal),
        sales: parseFloat(salesTotal),
        receipts: parseFloat(receiptsTotal)
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      message: 'Annual turnover retrieved successfully',
      year: targetYear,
      monthly: monthlyData,
      daily: dailyData
    });
  } catch (error) {
    console.error('Get annual turnover error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get real-time daily turnover
router.get('/realtime-daily-turnover', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const { start, end } = getDateRange('daily', today);

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

    res.json({
      message: 'Real-time daily turnover retrieved successfully',
      date: today.toISOString().split('T')[0],
      realtime_turnover: totalTurnover,
      sales: parseFloat(salesTotal),
      receipts: parseFloat(receiptsTotal)
    });
  } catch (error) {
    console.error('Get realtime daily turnover error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get real-time average basket
router.get('/realtime-average-basket', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const { start, end } = getDateRange('daily', today);

    const sales = await Sale.findAll({
      where: {
        date: { [Op.between]: [start, end] }
      },
      attributes: ['amount']
    });

    const receipts = await Receipt.findAll({
      where: {
        date: { [Op.between]: [start, end] }
      },
      attributes: ['amount']
    });

    const totalTransactions = sales.length + receipts.length;
    const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.amount), 0) +
                       receipts.reduce((sum, receipt) => sum + parseFloat(receipt.amount), 0);

    const averageBasket = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    res.json({
      message: 'Real-time average basket retrieved successfully',
      date: today.toISOString().split('T')[0],
      average_basket: averageBasket,
      total_transactions: totalTransactions,
      total_amount: totalAmount
    });
  } catch (error) {
    console.error('Get realtime average basket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get real-time client count
router.get('/realtime-client-count', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const { start, end } = getDateRange('daily', today);

    const salesCount = await Sale.count({
      where: {
        date: { [Op.between]: [start, end] }
      }
    });

    const receiptsCount = await Receipt.count({
      where: {
        date: { [Op.between]: [start, end] }
      }
    });

    const totalClients = salesCount + receiptsCount;

    res.json({
      message: 'Real-time client count retrieved successfully',
      date: today.toISOString().split('T')[0],
      total_clients: totalClients,
      sales_clients: salesCount,
      receipt_clients: receiptsCount
    });
  } catch (error) {
    console.error('Get realtime client count error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get turnover forecast
router.get('/forecast', authenticateToken, async (req, res) => {
  try {
    const { annual_objective } = req.query;
    const objective = annual_objective ? parseFloat(annual_objective) : 50000; // Default objective

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();

    // Get year-to-date turnover
    const salesTotal = await Sale.sum('amount', {
      where: {
        date: { [Op.between]: [startOfYear, now] }
      }
    }) || 0;

    const receiptsTotal = await Receipt.sum('amount', {
      where: {
        date: { [Op.between]: [startOfYear, now] }
      }
    }) || 0;

    const ytdTurnover = parseFloat(salesTotal) + parseFloat(receiptsTotal);
    const percentageAchieved = (ytdTurnover / objective) * 100;

    // Simple forecast based on current pace
    const daysPassed = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    const totalDaysInYear = new Date(currentYear, 11, 31).getDate() === 29 ? 366 : 365; // Leap year check
    const dailyAverage = ytdTurnover / daysPassed;
    const projectedTotal = dailyAverage * totalDaysInYear;

    res.json({
      message: 'Turnover forecast retrieved successfully',
      year: currentYear,
      annual_objective: objective,
      ytd_turnover: ytdTurnover,
      percentage_achieved: percentageAchieved,
      projected_total: projectedTotal,
      forecast_accuracy: projectedTotal >= objective ? 'on_track' : 'behind'
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
