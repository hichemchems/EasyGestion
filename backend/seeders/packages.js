const { Package } = require('../models');

module.exports = async () => {
  await Package.bulkCreate([
    { name: 'Barbe', price: 7.00, is_active: true },
    { name: 'Coupe de cheveux', price: 12.00, is_active: true },
    { name: 'Coupe de cheveux sans contour', price: 16.00, is_active: true },
    { name: 'Coupe de cheveux avec contour', price: 19.00, is_active: true },
    { name: 'Coupe de cheveux enfant', price: 10.00, is_active: true },
    { name: 'Package 6', price: 15.00, is_active: true }
  ]);
};
