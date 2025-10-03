const { sequelize } = require('./config/database');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  const migrationsPath = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsPath).sort();

  // Get already run migrations
  const [existingMigrations] = await sequelize.query('SELECT name FROM SequelizeMeta ORDER BY name');
  const runMigrationsSet = new Set(existingMigrations.map(m => m.name));

  for (const file of migrationFiles) {
    if (file.endsWith('.js') && !runMigrationsSet.has(file)) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsPath, file));
      await migration.up(sequelize.getQueryInterface(), sequelize.constructor);

      // Record the migration as run
      await sequelize.query('INSERT INTO SequelizeMeta (name) VALUES (?)', {
        replacements: [file]
      });
    }
  }
};

runMigrations()
  .then(() => {
    console.log('Migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
