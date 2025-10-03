const { sequelize } = require('./config/database');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  const migrationsPath = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsPath).sort();

  for (const file of migrationFiles) {
    if (file.endsWith('.js')) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsPath, file));
      await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    }
  }
};

const runSeeders = async () => {
  const seedersPath = path.join(__dirname, 'seeders');
  const seederFiles = fs.readdirSync(seedersPath).sort();

  for (const file of seederFiles) {
    if (file.endsWith('.js')) {
      console.log(`Running seeder: ${file}`);
      const seeder = require(path.join(seedersPath, file));
      await seeder.up(sequelize.getQueryInterface(), sequelize.constructor);
    }
  }
};

const initDatabase = async () => {
  try {
    console.log('Initializing database...');

    // Run migrations
    await runMigrations();
    console.log('Migrations completed.');

    // Run seeders
    await runSeeders();
    console.log('Seeders completed.');

    console.log('Database initialization completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

initDatabase();
