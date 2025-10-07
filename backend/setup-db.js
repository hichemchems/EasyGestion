const mysql = require('mysql2/promise');
require('dotenv').config();

const setupDatabase = async () => {
  let connection;

  try {
    // Connect to MySQL as root (assuming no password or password from env)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: 'root',
      password: process.env.DB_ROOT_PASSWORD || '', // Set DB_ROOT_PASSWORD in .env if root has password
    });

    console.log('Connected to MySQL as root');

    // Create database if not exists
    await connection.execute('CREATE DATABASE IF NOT EXISTS easygestion');
    console.log('Database easygestion created or already exists');

    // Create user if not exists
    const user = process.env.DB_USER || 'easygestionuser';
    const password = process.env.DB_PASSWORD || 'password'; // Default password, change in .env
    await connection.execute(`CREATE USER IF NOT EXISTS '${user}'@'localhost' IDENTIFIED BY '${password}'`);
    console.log(`User ${user} created or already exists`);

    // Grant privileges
    await connection.execute(`GRANT ALL PRIVILEGES ON easygestion.* TO '${user}'@'localhost'`);
    console.log('Privileges granted');

    // Flush privileges
    await connection.execute('FLUSH PRIVILEGES');
    console.log('Privileges flushed');

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

setupDatabase();
