'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employees', 'avatar_path', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('employees', 'contract_path', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('employees', 'employment_declaration_path', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('employees', 'certification_path', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employees', 'avatar_path');
    await queryInterface.removeColumn('employees', 'contract_path');
    await queryInterface.removeColumn('employees', 'employment_declaration_path');
    await queryInterface.removeColumn('employees', 'certification_path');
  }
};
