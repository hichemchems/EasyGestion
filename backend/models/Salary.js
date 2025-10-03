const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Salary = sequelize.define('Salary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  base_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  commission_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  total_salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  period_start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  period_end: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'salaries',
  timestamps: false
});

module.exports = Salary;
