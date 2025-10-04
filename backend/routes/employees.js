const express = require('express');
const { body, validationResult } = require('express-validator');
const { Sale, Package, Employee, Receipt } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { io } = require('../index');

const router = express.Router();

// Validation rules for sale creation
const saleValidation = [
  body('package_id').isInt({ min: 1 }).withMessage('Valid package ID is required'),
  body('client_name').isLength({ min: 1 }).withMessage('Client name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// Validation rules for sale update (package_id optional)
const saleUpdateValidation = [
  body('package_id').optional().isInt({ min: 1 }).withMessage('Valid package ID is required'),
  body('client_name').isLength({ min: 1 }).withMessage('Client name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// Validation rules for receipt creation
const receiptValidation = [
  body('client_name').isLength({ min: 1 }).withMessage('Client name is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// Middleware to check if user can access employee data
const canAccessEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin/superAdmin can access any employee
    if (userRole === 'admin' || userRole === 'superAdmin') {
      return next();
    }

    // Users can only access their own employee data
    const employee = await Employee.findOne({ where: { id, user_id: userId } });
    if (!employee) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get sales for employee
router.get('/:id/sales', authenticateToken, canAccessEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    const sales = await Sale.findAll({
      where: { employee_id: id },
      include: [{
        model: Package,
        attributes: ['id', 'name', 'price']
      }],
      order: [['date', 'DESC']]
    });

    res.json({
      message: 'Sales retrieved successfully',
      sales
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create sale for employee
router.post('/:id/sales', authenticateToken, canAccessEmployee, saleValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { package_id, client_name, description } = req.body;

    // Check if package exists and is active
    const pkg = await Package.findOne({
      where: { id: package_id, is_active: true }
    });

    if (!pkg) {
      return res.status(400).json({ message: 'Invalid or inactive package' });
    }

    // Create sale with package price
    const sale = await Sale.create({
      employee_id: id,
      package_id,
      client_name,
      amount: pkg.price,
      description
    });

    // Fetch the created sale with package info
    const createdSale = await Sale.findByPk(sale.id, {
      include: [{
        model: Package,
        attributes: ['id', 'name', 'price']
      }]
    });

    // Emit real-time update for sale creation
    io.emit('sale-created', {
      employee_id: id,
      sale: createdSale
    });

    res.status(201).json({
      message: 'Sale created successfully',
      sale: createdSale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id/sales/:saleId', authenticateToken, canAccessEmployee, saleUpdateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, saleId } = req.params;
    const { package_id, client_name, description } = req.body;

    // Check if sale exists and belongs to employee
    const sale = await Sale.findOne({
      where: { id: saleId, employee_id: id }
    });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // If package_id changed, validate new package
    if (package_id && package_id !== sale.package_id) {
      const pkg = await Package.findOne({
        where: { id: package_id, is_active: true }
      });

      if (!pkg) {
        return res.status(400).json({ message: 'Invalid or inactive package' });
      }

      // Update amount to new package price
      await sale.update({
        package_id,
        client_name,
        amount: pkg.price,
        description
      });
    } else {
      await sale.update({
        client_name,
        description
      });
    }

    // Fetch updated sale with package info
    const updatedSale = await Sale.findByPk(saleId, {
      include: [{
        model: Package,
        attributes: ['id', 'name', 'price']
      }]
    });

    // Emit real-time update for sale update
    io.emit('sale-updated', {
      employee_id: id,
      sale: updatedSale
    });

    res.json({
      message: 'Sale updated successfully',
      sale: updatedSale
    });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete sale
router.delete('/:id/sales/:saleId', authenticateToken, canAccessEmployee, async (req, res) => {
  try {
    const { id, saleId } = req.params;

    // Check if sale exists and belongs to employee
    const sale = await Sale.findOne({
      where: { id: saleId, employee_id: id }
    });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    await sale.destroy();

    // Emit real-time update for sale deletion
    io.emit('sale-deleted', {
      employee_id: id,
      sale_id: saleId
    });

    res.json({
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get receipts for employee
router.get('/:id/receipts', authenticateToken, canAccessEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    const receipts = await Receipt.findAll({
      where: { employee_id: id },
      order: [['date', 'DESC']]
    });

    res.json({
      message: 'Receipts retrieved successfully',
      receipts
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create receipt for employee
router.post('/:id/receipts', authenticateToken, canAccessEmployee, receiptValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { client_name, amount, description } = req.body;

    const receipt = await Receipt.create({
      employee_id: id,
      client_name,
      amount,
      description
    });

    res.status(201).json({
      message: 'Receipt created successfully',
      receipt
    });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update receipt
router.put('/:id/receipts/:receiptId', authenticateToken, canAccessEmployee, receiptValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, receiptId } = req.params;
    const { client_name, amount, description } = req.body;

    const receipt = await Receipt.findOne({
      where: { id: receiptId, employee_id: id }
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    await receipt.update({
      client_name,
      amount,
      description
    });

    res.json({
      message: 'Receipt updated successfully',
      receipt
    });
  } catch (error) {
    console.error('Update receipt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete receipt
router.delete('/:id/receipts/:receiptId', authenticateToken, canAccessEmployee, async (req, res) => {
  try {
    const { id, receiptId } = req.params;

    const receipt = await Receipt.findOne({
      where: { id: receiptId, employee_id: id }
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    await receipt.destroy();

    res.json({
      message: 'Receipt deleted successfully'
    });
  } catch (error) {
    console.error('Delete receipt error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get remaining revenue for employee (current month receipts and sales minus percentage charges)
router.get('/:id/remaining-revenue', authenticateToken, canAccessEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get employee's deduction percentage
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get sales for current month
    const salesTotal = await Sale.sum('amount', {
      where: {
        employee_id: id,
        date: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    }) || 0;

    // Get receipts for current month
    const receiptsTotal = await Receipt.sum('amount', {
      where: {
        employee_id: id,
        date: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    }) || 0;

    const totalRevenue = parseFloat(salesTotal) + parseFloat(receiptsTotal);
    const charges = totalRevenue * (employee.deduction_percentage / 100);
    const remainingRevenue = totalRevenue - charges;

    res.json({
      message: 'Remaining revenue calculated successfully',
      employee_id: id,
      month: currentDate.toISOString().slice(0, 7),
      total_revenue: totalRevenue,
      sales: parseFloat(salesTotal),
      receipts: parseFloat(receiptsTotal),
      deduction_percentage: employee.deduction_percentage,
      charges: charges,
      remaining_revenue: remainingRevenue
    });
  } catch (error) {
    console.error('Get remaining revenue error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
