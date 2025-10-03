const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  position: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  hire_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  deduction_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  contract_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  employment_declaration_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  certification_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  avatar_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'employees',
  timestamps: false
});

module.exports = Employee;
