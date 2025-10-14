'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingPackages = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM packages',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingPackages[0].count === 0) {
      await queryInterface.bulkInsert('packages', [
        { name: 'Barbe', description: 'Service de rasage de barbe', price: 7.00, duration_months: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Coupe de cheveux', description: 'Coupe de cheveux standard', price: 12.00, duration_months: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Coupe de cheveux sans contour', description: 'Coupe de cheveux sans contour', price: 16.00, duration_months: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Coupe de cheveux avec contour', description: 'Coupe de cheveux avec contour', price: 19.00, duration_months: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Coupe de cheveux enfant', description: 'Coupe de cheveux pour enfant', price: 10.00, duration_months: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Package 6', description: 'Package spécial', price: 15.00, duration_months: 1, is_active: true, created_at: new Date(), updated_at: new Date() }
      ], {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('packages', null, {});
  }
};
