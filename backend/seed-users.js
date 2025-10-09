require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

async function seedUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const passwordHash = await bcrypt.hash('Admin123456789!', 12);

    // Delete existing
    await User.destroy({ where: { email: 'superadmin@gmail.com' } });
    await User.destroy({ where: { email: 'admin@gmail.com' } });
    await User.destroy({ where: { username: 'superadmin' } });
    await User.destroy({ where: { username: 'admin' } });

    // Create users
    await User.create({
      username: 'superadmin',
      email: 'superadmin@gmail.com',
      password_hash: passwordHash,
      role: 'superAdmin'
    });

    await User.create({
      username: 'admin',
      email: 'admin@gmail.com',
      password_hash: passwordHash,
      role: 'admin'
    });

    console.log('Users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
