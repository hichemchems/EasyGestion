const request = require('supertest');
const { app } = require('../index'); // Import the app without starting the server
const { sequelize, User, Employee } = require('../models');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  await sequelize.sync({ force: true }); // Force sync for clean test database
  // Seed packages
  const seedPackages = require('../seeders/packages');
  await seedPackages();

  // Create test user
  const hashedPassword = await bcrypt.hash('YourAdminPassword123!', 10);
  const user = await User.create({
    username: 'newadmin',
    email: 'newadmin@example.com',
    password_hash: hashedPassword,
    role: 'admin'
  });
  await Employee.create({
    user_id: user.id,
    name: 'Test Admin',
    position: 'Admin',
    hire_date: '2024-01-01',
    deduction_percentage: 10
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Phase 7: Package and Sales API', () => {
  let token;
  let employeeId;
  let saleId;

  test('Login and get token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'newadmin@example.com',
        password: 'YourAdminPassword123!'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  test('Get packages', async () => {
    const res = await request(app)
      .get('/api/v1/packages');
    expect(res.statusCode).toEqual(200);
    expect(res.body.packages).toBeInstanceOf(Array);
    expect(res.body.packages.length).toBeGreaterThan(0);
  });

  test('Get all packages (admin)', async () => {
    const res = await request(app)
      .get('/api/v1/packages/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.packages).toBeInstanceOf(Array);
  });

  test('Create package (admin)', async () => {
    const res = await request(app)
      .post('/api/v1/packages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Package',
        price: 25.00,
        is_active: true
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.package).toHaveProperty('id');
  });

  test('Update package (admin)', async () => {
    const packagesRes = await request(app)
      .get('/api/v1/packages/admin')
      .set('Authorization', `Bearer ${token}`);
    const packageId = packagesRes.body.packages.find(p => p.name === 'Test Package').id;

    const res = await request(app)
      .put(`/api/v1/packages/${packageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Test Package',
        price: 30.00
      });
    expect(res.statusCode).toEqual(200);
  });

  test('Create sale for employee', async () => {
    // Get employeeId from users endpoint
    const usersRes = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);
    expect(usersRes.statusCode).toEqual(200);
    employeeId = usersRes.body[0].Employee.id;

    // Get a package id
    const packagesRes = await request(app)
      .get('/api/v1/packages');
    expect(packagesRes.statusCode).toEqual(200);
    const packageId = packagesRes.body.packages[0].id;

    const res = await request(app)
      .post(`/api/v1/employees/${employeeId}/sales`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        package_id: packageId,
        client_name: 'Test Client',
        description: 'Test sale'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.sale).toHaveProperty('id');
    expect(res.body.sale.amount).toEqual(packagesRes.body.packages[0].price);
    saleId = res.body.sale.id;
  });

  test('Get sales for employee', async () => {
    const res = await request(app)
      .get(`/api/v1/employees/${employeeId}/sales`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.sales).toBeInstanceOf(Array);
    expect(res.body.sales.length).toBeGreaterThan(0);
  });

  test('Update sale', async () => {
    const res = await request(app)
      .put(`/api/v1/employees/${employeeId}/sales/${saleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        client_name: 'Updated Client',
        description: 'Updated sale'
      });
    expect(res.statusCode).toEqual(200);
  });

  test('Delete sale', async () => {
    const res = await request(app)
      .delete(`/api/v1/employees/${employeeId}/sales/${saleId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
  });

  test('Deactivate package (admin)', async () => {
    const packagesRes = await request(app)
      .get('/api/v1/packages/admin')
      .set('Authorization', `Bearer ${token}`);
    const packageId = packagesRes.body.packages.find(p => p.name === 'Updated Test Package').id;

    const res = await request(app)
      .delete(`/api/v1/packages/${packageId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
  });
});
