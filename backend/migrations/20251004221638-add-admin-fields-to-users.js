'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'siret', {
      type: Sequelize.STRING(14),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'logo_path', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'siret');
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'logo_path');
  }
};
