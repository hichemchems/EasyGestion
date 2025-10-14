'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('packages', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('packages', 'duration_months', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    await queryInterface.addColumn('packages', 'features', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('packages', 'description');
    await queryInterface.removeColumn('packages', 'duration_months');
    await queryInterface.removeColumn('packages', 'features');
  }
};
