'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('packages', [
      { name: 'Barbe', price: 7.00, is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Coupe de cheveux', price: 12.00, is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Coupe de cheveux sans contour', price: 16.00, is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Coupe de cheveux avec contour', price: 19.00, is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Coupe de cheveux enfant', price: 10.00, is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Package 6', price: 15.00, is_active: true, created_at: new Date(), updated_at: new Date() }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('packages', null, {});
  }
};
