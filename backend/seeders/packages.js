const { Package } = require('../models');

const seedPackages = async () => {
  try {
    const packages = [
      { name: 'Barbe', price: 7.00 },
      { name: 'Coupe de cheveux', price: 12.00 },
      { name: 'Coupe de cheveux sans contour', price: 16.00 },
      { name: 'Coupe de cheveux avec contour', price: 19.00 },
      { name: 'Coupe de cheveux enfant', price: 10.00 },
      { name: 'Package 6', price: 15.00 } // Placeholder for 6th package
    ];

    for (const pkg of packages) {
      const existing = await Package.findOne({ where: { name: pkg.name } });
      if (!existing) {
        await Package.create(pkg);
        console.log(`Seeded package: ${pkg.name}`);
      }
    }

    console.log('Packages seeded successfully');
  } catch (error) {
    console.error('Error seeding packages:', error);
  }
};

module.exports = seedPackages;
