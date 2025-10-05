'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const passwordHash = await bcrypt.hash('Hichem.naima12', 10);

    await queryInterface.bulkInsert('users', [
      {
        username: 'superadmin',
        email: 'superadmin@gmail.com',
        password_hash: passwordHash,
        role: 'superAdmin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'admin',
        email: 'admin@gmail.com',
        password_hash: passwordHash,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: ['superadmin@gmail.com', 'admin@gmail.com']
    }, {});
  }
};
