const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sale = sequelize.define('Sale', {
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
  package_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'packages',
      key: 'id'
    }
  },
  client_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sales',
  timestamps: false
});

module.exports = Sale;
