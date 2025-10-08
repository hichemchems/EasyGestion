'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const passwordHash = await bcrypt.hash('Hichem.naima12', 10);

    // Check if users already exist
    const existingSuperAdmin = await queryInterface.sequelize.query('SELECT id FROM users WHERE email = ? LIMIT 1', {
      replacements: ['superadmin@gmail.com'],
      type: Sequelize.QueryTypes.SELECT
    });

    const existingAdmin = await queryInterface.sequelize.query('SELECT id FROM users WHERE email = ? LIMIT 1', {
      replacements: ['admin@gmail.com'],
      type: Sequelize.QueryTypes.SELECT
    });

    const usersToInsert = [];

    if (!existingSuperAdmin) {
      usersToInsert.push({
        username: 'superadmin',
        email: 'superadmin@gmail.com',
        password_hash: passwordHash,
        role: 'superAdmin',
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (!existingAdmin) {
      usersToInsert.push({
        username: 'admin',
        email: 'admin@gmail.com',
        password_hash: passwordHash,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('users', usersToInsert, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { email: ['superadmin@gmail.com', 'admin@gmail.com'] }, {});
  }
};
