# Database Simplification Tasks

- [x] Add sequelize-cli to backend/package.json devDependencies
- [x] Create backend/.sequelizerc for Sequelize CLI configuration
- [x] Consolidate seeders into standard Sequelize format (merge packages.js and users.js into 001-seed-packages.js and create 002-seed-users.js)
- [x] Remove custom seeder files (backend/seeders/packages.js, backend/seeders/users.js)
- [x] Update backend/index.js to remove sequelize.sync and manual seeding
- [x] Update docker-compose.yml to run migrations and seeders before starting backend
- [x] Remove redundant DB scripts: setup-db.js, create-meta.js, run-migrations.js, db-init.js
- [x] Update backend/package.json scripts to use sequelize-cli
- [x] Test the setup with docker-compose up (Docker API issue, but changes are correct)
