'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('goals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      monthly_target: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      daily_target: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      current_monthly_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      remaining_days: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      carry_over_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('goals', ['employee_id', 'month', 'year'], {
      unique: true,
      name: 'goals_employee_month_year_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('goals');
  }
};
