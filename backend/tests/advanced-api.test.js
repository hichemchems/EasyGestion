const request = require('supertest');
const { sequelize } = require('../config/database');
const { app, server } = require('../index');

let token;
let employeeId;

describe('Advanced API Features Tests', () => {
  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });

    // Create admin user
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        name: 'Admin User',
        position: 'Administrator',
        hire_date: '2023-01-01',
        deduction_percentage: 0,
        role: 'admin'
      });

    // Login as admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!'
      });

    token = loginRes.body.token;

    // Create employee
    const employeeRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'employee@example.com',
        password: 'EmployeePass123!',
        name: 'Test Employee',
        position: 'Barber',
        hire_date: '2023-01-01',
        deduction_percentage: 10
      });

    expect(employeeRes.statusCode).toEqual(201);
    employeeId = employeeRes.body.user.employee?.id || employeeRes.body.user.Employee?.id;
  }, 30000);

  afterAll(async () => {
    await sequelize.close();
    server.close();
  });

  describe('Receipts API', () => {
    let receiptId;

    test('Create receipt for employee', async () => {
      const res = await request(app)
        .post(`/api/employees/${employeeId}/receipts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          client_name: 'John Doe',
          amount: 25.50,
          description: 'Haircut service'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('receipt');
      expect(res.body.receipt.client_name).toBe('John Doe');
      expect(parseFloat(res.body.receipt.amount)).toBe(25.50);
      receiptId = res.body.receipt.id;
    });

    test('Get receipts for employee', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeId}/receipts`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('receipts');
      expect(Array.isArray(res.body.receipts)).toBe(true);
      expect(res.body.receipts.length).toBeGreaterThan(0);
    });

    test('Update receipt', async () => {
      const res = await request(app)
        .put(`/api/employees/${employeeId}/receipts/${receiptId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          client_name: 'Jane Doe',
          amount: 30.00,
          description: 'Updated haircut service'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.receipt.client_name).toBe('Jane Doe');
      expect(parseFloat(res.body.receipt.amount)).toBe(30.00);
    });

    test('Delete receipt', async () => {
      const res = await request(app)
        .delete(`/api/employees/${employeeId}/receipts/${receiptId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Receipt deleted successfully');
    });
  });

  describe('Analytics API', () => {
    beforeAll(async () => {
      // Create some test data
      await request(app)
        .post(`/api/employees/${employeeId}/receipts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          client_name: 'Test Client 1',
          amount: 20.00
        });

      await request(app)
        .post(`/api/employees/${employeeId}/receipts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          client_name: 'Test Client 2',
          amount: 15.00
        });
    });

    test('Get turnover data', async () => {
      const res = await request(app)
        .get('/api/analytics/turnover')
        .set('Authorization', `Bearer ${token}`)
        .query({ period: 'daily' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('turnover');
      expect(res.body.turnover).toHaveProperty('total');
      expect(res.body.turnover).toHaveProperty('sales');
      expect(res.body.turnover).toHaveProperty('receipts');
    });

    test('Get monthly evolution', async () => {
      const res = await request(app)
        .get('/api/analytics/evolution')
        .set('Authorization', `Bearer ${token}`)
        .query({ months: 3 });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('Get profit data', async () => {
      const res = await request(app)
        .get('/api/analytics/profit')
        .set('Authorization', `Bearer ${token}`)
        .query({ period: 'monthly' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('turnover');
      expect(res.body).toHaveProperty('expenses');
      expect(res.body).toHaveProperty('profit');
    });

    test('Get employee performance', async () => {
      const res = await request(app)
        .get('/api/analytics/performance')
        .set('Authorization', `Bearer ${token}`)
        .query({ period: 'monthly' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('employees');
      expect(Array.isArray(res.body.employees)).toBe(true);
    });

    test('Get daily turnover', async () => {
      const res = await request(app)
        .get('/api/analytics/daily-turnover')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('turnover');
      expect(res.body).toHaveProperty('date');
    });

    test('Get weekly turnover', async () => {
      const res = await request(app)
        .get('/api/analytics/weekly-turnover')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('turnover');
      expect(res.body).toHaveProperty('week_start');
      expect(res.body).toHaveProperty('week_end');
    });

    test('Get monthly turnover', async () => {
      const res = await request(app)
        .get('/api/analytics/monthly-turnover')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('cumulative_turnover');
      expect(res.body).toHaveProperty('month');
    });

    test('Get annual turnover', async () => {
      const res = await request(app)
        .get('/api/analytics/annual-turnover')
        .set('Authorization', `Bearer ${token}`)
        .query({ year: new Date().getFullYear() });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('monthly');
      expect(res.body).toHaveProperty('daily');
      expect(Array.isArray(res.body.monthly)).toBe(true);
      expect(Array.isArray(res.body.daily)).toBe(true);
    });

    test('Get real-time daily turnover', async () => {
      const res = await request(app)
        .get('/api/analytics/realtime-daily-turnover')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('realtime_turnover');
      expect(res.body).toHaveProperty('date');
    });

    test('Get real-time average basket', async () => {
      const res = await request(app)
        .get('/api/analytics/realtime-average-basket')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('average_basket');
      expect(res.body).toHaveProperty('total_transactions');
    });

    test('Get real-time client count', async () => {
      const res = await request(app)
        .get('/api/analytics/realtime-client-count')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('total_clients');
      expect(res.body).toHaveProperty('date');
    });

    test('Get turnover forecast', async () => {
      const res = await request(app)
        .get('/api/analytics/forecast')
        .set('Authorization', `Bearer ${token}`)
        .query({ annual_objective: 50000 });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('annual_objective');
      expect(res.body).toHaveProperty('ytd_turnover');
      expect(res.body).toHaveProperty('projected_total');
    });
  });

  describe('Expenses API', () => {
    let expenseId;

    test('Create expense', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'Supplies',
          amount: 150.00,
          date: new Date().toISOString().split('T')[0],
          description: 'Hair products purchase'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('expense');
      expect(res.body.expense.category).toBe('Supplies');
      expenseId = res.body.expense.id;
    });

    test('Get all expenses', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('expenses');
      expect(Array.isArray(res.body.expenses)).toBe(true);
    });

    test('Update expense', async () => {
      const res = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'Equipment',
          amount: 200.00,
          description: 'Updated equipment purchase'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.expense.category).toBe('Equipment');
      expect(parseFloat(res.body.expense.amount)).toBe(200.00);
    });

    test('Delete expense', async () => {
      const res = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Expense deleted successfully');
    });
  });

  describe('Admin Charges API', () => {
    let chargeId;

    test('Create admin charge', async () => {
      const res = await request(app)
        .post('/api/adminCharges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 500.00,
          description: 'Monthly rent'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('charge');
      expect(parseFloat(res.body.charge.amount)).toBe(500.00);
      chargeId = res.body.charge.id;
    });

    test('Get admin charges', async () => {
      const res = await request(app)
        .get('/api/adminCharges')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('charges');
      expect(Array.isArray(res.body.charges)).toBe(true);
    });

    test('Get alerts', async () => {
      const res = await request(app)
        .get('/api/adminCharges/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('alerts');
    });
  });

  describe('Salaries API', () => {
    test('Generate salaries', async () => {
      const res = await request(app)
        .post('/api/salaries/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          period_start: '2024-01-01',
          period_end: '2024-01-31'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('salaries');
      expect(Array.isArray(res.body.salaries)).toBe(true);
    });

    test('Get salaries', async () => {
      const res = await request(app)
        .get('/api/salaries')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('salaries');
      expect(Array.isArray(res.body.salaries)).toBe(true);
    });
  });

  describe('Goals API', () => {
    let goalId;

    test('Create goal', async () => {
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employee_id: employeeId,
          target_amount: 1000.00,
          period_start: '2024-01-01',
          period_end: '2024-01-31'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('goal');
      expect(parseFloat(res.body.goal.target_amount)).toBe(1000.00);
      goalId = res.body.goal.id;
    });

    test('Get goals', async () => {
      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('goals');
      expect(Array.isArray(res.body.goals)).toBe(true);
    });

    test('Update goal', async () => {
      const res = await request(app)
        .put(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          target_amount: 1200.00
        });

      expect(res.statusCode).toEqual(200);
      expect(parseFloat(res.body.goal.target_amount)).toBe(1200.00);
    });

    test('Delete goal', async () => {
      const res = await request(app)
        .delete(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Goal deleted successfully');
    });
  });

  describe('Alerts API', () => {
    test('Get alerts', async () => {
      const res = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('alerts');
      expect(Array.isArray(res.body.alerts)).toBe(true);
    });
  });
});
