'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('salaries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      base_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      commission_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      total_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      period_start: {
        type: Sequelize.DATE,
        allowNull: false
      },
      period_end: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('salaries');
  }
};
