const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Employee = require('./Employee');
const Package = require('./Package');
const Sale = require('./Sale');
const Receipt = require('./Receipt');
const Expense = require('./Expense');
const Salary = require('./Salary');

// Define associations
User.hasOne(Employee, { foreignKey: 'user_id', as: 'employee' });
Employee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Employee.hasMany(Sale, { foreignKey: 'employee_id', as: 'sales' });
Sale.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Package.hasMany(Sale, { foreignKey: 'package_id', as: 'sales' });
Sale.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

Employee.hasMany(Receipt, { foreignKey: 'employee_id', as: 'receipts' });
Receipt.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Employee.hasMany(Salary, { foreignKey: 'employee_id', as: 'salaries' });
Salary.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// Sync database (for development only)
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false }); // Set force: true to drop and recreate tables
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Employee,
  Package,
  Sale,
  Receipt,
  Expense,
  Salary,
  syncDatabase
};
