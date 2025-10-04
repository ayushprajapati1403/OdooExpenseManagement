import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

describe('Expense Management APIs - New Structure', () => {
  let adminToken: string;
  let managerToken: string;
  let employeeToken: string;
  let companyId: string;
  let adminUserId: string;
  let managerUserId: string;
  let employeeUserId: string;
  let expenseId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.approvalRequest.deleteMany();
    await prisma.expenseLine.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.managerRelation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.approvalRequest.deleteMany();
    await prisma.expenseLine.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.managerRelation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('Setup - Create Users', () => {
    it('should create admin user for testing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'admin@expenses.com',
          password: 'password123',
          name: 'Admin User',
          country: 'United States'
        });

      expect(response.status).toBe(201);
      adminToken = response.body.token;
      companyId = response.body.company.id;
      adminUserId = response.body.user.id;
    });

    it('should create manager user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'manager@expenses.com',
          password: 'password123',
          name: 'Manager User',
          role: 'MANAGER',
          isManagerApprover: true
        });

      expect(response.status).toBe(201);
      managerUserId = response.body.user.id;
    });

    it('should create employee user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'employee@expenses.com',
          password: 'password123',
          name: 'Employee User',
          role: 'EMPLOYEE'
        });

      expect(response.status).toBe(201);
      employeeUserId = response.body.user.id;
    });

    it('should login as employee', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@expenses.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      employeeToken = response.body.token;
    });

    it('should login as manager', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manager@expenses.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      managerToken = response.body.token;
    });
  });

  describe('POST /api/expenses', () => {
    it('should submit expense with basic details', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 50.00,
          currency: 'USD',
          category: 'Meals',
          description: 'Business lunch',
          date: '2024-01-15'
        });

      expect(response.status).toBe(201);
      expect(response.body.expense.amount).toBe(50.00);
      expect(response.body.expense.category).toBe('Meals');
      expect(response.body.expense.status).toBe('PENDING');
      expenseId = response.body.expense.id;
    });

    it('should submit expense with expense lines', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 75.50,
          currency: 'USD',
          category: 'Transportation',
          description: 'Taxi rides',
          date: '2024-01-16',
          expenseLines: [
            { amount: 25.00, description: 'Airport to hotel' },
            { amount: 30.00, description: 'Hotel to client' },
            { amount: 20.50, description: 'Client to airport' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.expense.amount).toBe(75.50);
    });

    it('should reject expense with invalid amount', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: -10,
          currency: 'USD',
          category: 'Meals',
          description: 'Business lunch',
          date: '2024-01-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Amount must be a positive number');
    });

    it('should reject expense with invalid currency', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 50.00,
          currency: 'US',
          category: 'Meals',
          description: 'Business lunch',
          date: '2024-01-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Currency must be a 3-letter code');
    });

    it('should reject expense with missing required fields', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 50.00,
          currency: 'USD'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Category is required');
      expect(response.body.details).toContain('Date is required');
    });

    it('should reject expense with invalid expense lines', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 50.00,
          currency: 'USD',
          category: 'Meals',
          description: 'Business lunch',
          date: '2024-01-15',
          expenseLines: [
            { amount: -10, description: 'Invalid amount' },
            { description: 'Missing amount' }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Expense line 1: Amount must be a positive number');
      expect(response.body.details).toContain('Expense line 2: Amount must be a positive number');
    });
  });

  describe('GET /api/expenses/my-expenses', () => {
    it('should get user expenses', async () => {
      const response = await request(app)
        .get('/api/expenses/my-expenses')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses).toBeInstanceOf(Array);
      expect(response.body.expenses.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter expenses by status', async () => {
      const response = await request(app)
        .get('/api/expenses/my-expenses?status=PENDING')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses).toBeInstanceOf(Array);
      response.body.expenses.forEach((expense: any) => {
        expect(expense.status).toBe('PENDING');
      });
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/expenses/my-expenses?page=1&limit=1')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/expenses/:expenseId', () => {
    it('should get expense by ID', async () => {
      const response = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.expense.id).toBe(expenseId);
      expect(response.body.expense.user).toBeDefined();
      expect(response.body.expense.expenseLines).toBeDefined();
      expect(response.body.expense.approvalRequests).toBeDefined();
    });

    it('should allow manager to view expense', async () => {
      const response = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.expense.id).toBe(expenseId);
    });

    it('should return 404 for non-existent expense', async () => {
      const response = await request(app)
        .get('/api/expenses/non-existent-id')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Expense not found');
    });
  });

  describe('PUT /api/expenses/:expenseId', () => {
    it('should update pending expense', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 60.00,
          description: 'Updated business lunch'
        });

      expect(response.status).toBe(200);
      expect(response.body.expense.amount).toBe(60.00);
      expect(response.body.message).toBe('Expense updated successfully');
    });

    it('should update expense lines', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          expenseLines: [
            { amount: 40.00, description: 'Main course' },
            { amount: 20.00, description: 'Dessert' }
          ]
        });

      expect(response.status).toBe(200);
    });

    it('should reject update with invalid data', async () => {
      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: -10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/expenses/:expenseId', () => {
    it('should delete pending expense', async () => {
      // Create an expense to delete
      const createResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 25.00,
          currency: 'USD',
          category: 'Office Supplies',
          description: 'Test expense for deletion',
          date: '2024-01-17'
        });

      const deleteExpenseId = createResponse.body.expense.id;

      const response = await request(app)
        .delete(`/api/expenses/${deleteExpenseId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Expense deleted successfully');
    });

    it('should reject deletion of non-existent expense', async () => {
      const response = await request(app)
        .delete('/api/expenses/non-existent-id')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Expense not found');
    });
  });

  describe('GET /api/expenses/company/all', () => {
    it('should get company expenses (Manager)', async () => {
      const response = await request(app)
        .get('/api/expenses/company/all')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should get company expenses (Admin)', async () => {
      const response = await request(app)
        .get('/api/expenses/company/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.expenses).toBeInstanceOf(Array);
    });

    it('should reject company expenses access for employee', async () => {
      const response = await request(app)
        .get('/api/expenses/company/all')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('GET /api/expenses/company/statistics', () => {
    it('should get expense statistics (Manager)', async () => {
      const response = await request(app)
        .get('/api/expenses/company/statistics')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.totalExpenses).toBeGreaterThanOrEqual(0);
      expect(response.body.statistics.pendingExpenses).toBeGreaterThanOrEqual(0);
      expect(response.body.statistics.approvedExpenses).toBeGreaterThanOrEqual(0);
      expect(response.body.statistics.rejectedExpenses).toBeGreaterThanOrEqual(0);
    });

    it('should get expense statistics (Admin)', async () => {
      const response = await request(app)
        .get('/api/expenses/company/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics).toBeDefined();
    });

    it('should reject statistics access for employee', async () => {
      const response = await request(app)
        .get('/api/expenses/company/statistics')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('Authentication Tests', () => {
    it('should reject all expense operations without token', async () => {
      const response = await request(app)
        .get('/api/expenses/my-expenses');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject all expense operations with invalid token', async () => {
      const response = await request(app)
        .get('/api/expenses/my-expenses')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });
});
