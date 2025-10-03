'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employees', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      position: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      hire_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deduction_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('employees');
  }
};
