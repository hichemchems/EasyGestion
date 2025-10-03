const express = require('express');
const { Op } = require('sequelize');
const { Salary, Employee, Sale, Receipt, AdminCharge } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get salary for employee
router.get('/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { period_start, period_end } = req.query;

    // Check access permissions
    const userRole = req.user.role;
    if (userRole !== 'admin' && userRole !== 'superAdmin' && req.user.id !== parseInt(employeeId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const whereClause = { employee_id: employeeId };
    if (period_start && period_end) {
      whereClause.period_start = period_start;
      whereClause.period_end = period_end;
    }

    const salaries = await Salary.findAll({
      where: whereClause,
      order: [['period_end', 'DESC']]
    });

    res.json({
      message: 'Salaries retrieved successfully',
      salaries
    });
  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Generate salary automatically
router.post('/generate', authenticateToken, authorizeRoles('admin', 'superAdmin'), async (req, res) => {
  try {
    const { employee_id, period_start, period_end } = req.body;

    if (!employee_id || !period_start || !period_end) {
      return res.status(400).json({ message: 'Employee ID, period start, and period end are required' });
    }

    // Get employee details
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate turnover for the period
    const salesTotal = await Sale.sum('amount', {
      where: {
        employee_id,
        date: {
          [Op.between]: [new Date(period_start), new Date(period_end)]
        }
      }
    }) || 0;

    const receiptsTotal = await Receipt.sum('amount', {
      where: {
        employee_id,
        date: {
          [Op.between]: [new Date(period_start), new Date(period_end)]
        }
      }
    }) || 0;

    const totalTurnover = parseFloat(salesTotal) + parseFloat(receiptsTotal);

    // Get admin charges
    const adminCharges = await AdminCharge.findOne();
    const totalCharges = adminCharges ? (
      parseFloat(adminCharges.rent) +
      parseFloat(adminCharges.charges) +
      parseFloat(adminCharges.operating_costs) +
      parseFloat(adminCharges.electricity) +
      parseFloat(adminCharges.salaries)
    ) : 0;

    // Calculate number of working days in the period (excluding Sundays)
    const startDate = new Date(period_start);
    const endDate = new Date(period_end);
    let workingDays = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0) { // 0 = Sunday
        workingDays++;
      }
    }

    // Calculate base salary (turnover minus charges)
    const baseSalary = totalTurnover - totalCharges;

    // Divide by working days to get daily salary, then apply deduction percentage
    const dailySalary = baseSalary / workingDays;
    const netSalary = dailySalary * (1 - employee.deduction_percentage / 100);

    // Create salary record
    const salary = await Salary.create({
      employee_id,
      base_salary: baseSalary,
      commission_percentage: employee.deduction_percentage,
      total_salary: netSalary,
      period_start,
      period_end
    });

    res.status(201).json({
      message: 'Salary generated successfully',
      salary: {
        ...salary.toJSON(),
        turnover_breakdown: {
          sales: parseFloat(salesTotal),
          receipts: parseFloat(receiptsTotal),
          total: totalTurnover
        },
        charges: totalCharges,
        deduction_percentage: employee.deduction_percentage,
        working_days: workingDays,
        daily_salary: dailySalary
      }
    });
  } catch (error) {
    console.error('Generate salary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
