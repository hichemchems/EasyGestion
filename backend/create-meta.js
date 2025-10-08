const { sequelize } = require('./config/database');

const createMetaTable = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS SequelizeMeta (
        name VARCHAR(255) NOT NULL UNIQUE,
        PRIMARY KEY (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    console.log('SequelizeMeta table created or already exists');
  } catch (error) {
    console.error('Error creating SequelizeMeta table:', error);
  } finally {
    await sequelize.close();
  }
};

createMetaTable();
