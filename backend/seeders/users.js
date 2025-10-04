const bcrypt = require('bcryptjs');
const { User } = require('../models');

const seedUsers = async () => {
  try {
    const passwordHash = await bcrypt.hash('Hichem.naima12', 10);

    // Check if users already exist
    const existingSuperAdmin = await User.findOne({ where: { email: 'superadmin@gmail.com' } });
    const existingAdmin = await User.findOne({ where: { email: 'admin@gmail.com' } });

    if (!existingSuperAdmin) {
      await User.create({
        email: 'superadmin@gmail.com',
        password_hash: passwordHash,
        role: 'superAdmin'
      });
      console.log('SuperAdmin user created');
    }

    if (!existingAdmin) {
      await User.create({
        email: 'admin@gmail.com',
        password_hash: passwordHash,
        role: 'admin'
      });
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

module.exports = seedUsers;
