const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Employee = require('./Employee');
const Package = require('./Package');
const Sale = require('./Sale');
const Receipt = require('./Receipt');
const Expense = require('./Expense');
const Salary = require('./Salary');
const AdminCharge = require('./AdminCharge');
const Goal = require('./Goal');
const Alert = require('./Alert');

// Define associations
User.hasOne(Employee, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Employee.belongsTo(User, { foreignKey: 'user_id' });

Employee.hasMany(Sale, { foreignKey: 'employee_id', onDelete: 'CASCADE' });
Sale.belongsTo(Employee, { foreignKey: 'employee_id' });

Package.hasMany(Sale, { foreignKey: 'package_id', onDelete: 'CASCADE' });
Sale.belongsTo(Package, { foreignKey: 'package_id' });

Employee.hasMany(Receipt, { foreignKey: 'employee_id', onDelete: 'CASCADE' });
Receipt.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.hasMany(Salary, { foreignKey: 'employee_id', onDelete: 'CASCADE' });
Salary.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.hasMany(Goal, { foreignKey: 'employee_id', onDelete: 'CASCADE' });
Goal.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.hasMany(Alert, { foreignKey: 'employee_id', onDelete: 'CASCADE' });
Alert.belongsTo(Employee, { foreignKey: 'employee_id' });

// Export models
module.exports = {
  sequelize,
  User,
  Employee,
  Package,
  Sale,
  Receipt,
  Expense,
  Salary,
  AdminCharge,
  Goal,
  Alert
};
