import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

describe('Company & OCR APIs - New Architecture', () => {
  let adminToken: string;
  let managerToken: string;
  let employeeToken: string;
  let companyId: string;
  let adminUserId: string;
  let managerUserId: string;
  let employeeUserId: string;
  let approvalFlowId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.approvalRequest.deleteMany();
    await prisma.expenseLine.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.approvalFlowStep.deleteMany();
    await prisma.approvalFlow.deleteMany();
    await prisma.managerRelation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.approvalRequest.deleteMany();
    await prisma.expenseLine.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.approvalFlowStep.deleteMany();
    await prisma.approvalFlow.deleteMany();
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
          email: 'admin@companyocr.com',
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
          email: 'manager@companyocr.com',
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
          email: 'employee@companyocr.com',
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
          email: 'employee@companyocr.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      employeeToken = response.body.token;
    });

    it('should login as manager', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manager@companyocr.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      managerToken = response.body.token;
    });
  });

  describe('Company API Tests', () => {
    describe('POST /api/company/approval-flows', () => {
      it('should create approval flow (Admin)', async () => {
        const response = await request(app)
          .post('/api/company/approval-flows')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Company Test Flow',
            ruleType: 'UNANIMOUS',
            steps: [
              { role: 'MANAGER' },
              { role: 'FINANCE' }
            ]
          });

        expect(response.status).toBe(201);
        expect(response.body.approvalFlow.name).toBe('Company Test Flow');
        expect(response.body.approvalFlow.steps).toHaveLength(2);
        approvalFlowId = response.body.approvalFlow.id;
      });

      it('should reject approval flow creation by non-admin', async () => {
        const response = await request(app)
          .post('/api/company/approval-flows')
          .set('Authorization', `Bearer ${managerToken}`)
          .send({
            name: 'Manager Flow',
            ruleType: 'UNANIMOUS',
            steps: [{ role: 'MANAGER' }]
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied: Insufficient role');
      });

      it('should reject invalid approval flow data', async () => {
        const response = await request(app)
          .post('/api/company/approval-flows')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'A', // Too short
            ruleType: 'INVALID',
            steps: [] // Empty steps
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('GET /api/company/approval-flows', () => {
      it('should get all approval flows (Admin)', async () => {
        const response = await request(app)
          .get('/api/company/approval-flows')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.approvalFlows).toBeInstanceOf(Array);
        expect(response.body.approvalFlows.length).toBeGreaterThan(0);
      });

      it('should reject access by non-admin', async () => {
        const response = await request(app)
          .get('/api/company/approval-flows')
          .set('Authorization', `Bearer ${managerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied: Insufficient role');
      });
    });

    describe('GET /api/company/approval-flows/:flowId', () => {
      it('should get approval flow by ID (Admin)', async () => {
        const response = await request(app)
          .get(`/api/company/approval-flows/${approvalFlowId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.approvalFlow.id).toBe(approvalFlowId);
        expect(response.body.approvalFlow.steps).toBeDefined();
      });

      it('should return 404 for non-existent flow', async () => {
        const response = await request(app)
          .get('/api/company/approval-flows/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Approval flow not found');
      });
    });

    describe('PUT /api/company/approval-flows/:flowId', () => {
      it('should update approval flow (Admin)', async () => {
        const response = await request(app)
          .put(`/api/company/approval-flows/${approvalFlowId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Company Flow',
            steps: [
              { role: 'MANAGER' },
              { role: 'FINANCE' },
              { role: 'DIRECTOR' }
            ]
          });

        expect(response.status).toBe(200);
        expect(response.body.approvalFlow.name).toBe('Updated Company Flow');
        expect(response.body.approvalFlow.steps).toHaveLength(3);
      });
    });

    describe('DELETE /api/company/approval-flows/:flowId', () => {
      it('should delete approval flow (Admin)', async () => {
        // Create a flow to delete
        const createResponse = await request(app)
          .post('/api/company/approval-flows')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Flow to Delete',
            ruleType: 'UNANIMOUS',
            steps: [{ role: 'MANAGER' }]
          });

        const flowToDeleteId = createResponse.body.approvalFlow.id;

        const response = await request(app)
          .delete(`/api/company/approval-flows/${flowToDeleteId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Approval flow deleted successfully');
      });
    });

    describe('GET /api/company/statistics', () => {
      it('should get company statistics (Admin)', async () => {
        const response = await request(app)
          .get('/api/company/statistics')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.statistics).toBeDefined();
        expect(response.body.statistics.totalUsers).toBeGreaterThanOrEqual(0);
        expect(response.body.statistics.totalExpenses).toBeGreaterThanOrEqual(0);
      });

      it('should reject access by non-admin', async () => {
        const response = await request(app)
          .get('/api/company/statistics')
          .set('Authorization', `Bearer ${managerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied: Insufficient role');
      });
    });

    describe('GET /api/company/users', () => {
      it('should get company users (Admin)', async () => {
        const response = await request(app)
          .get('/api/company/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.users).toBeInstanceOf(Array);
        expect(response.body.users.length).toBeGreaterThanOrEqual(3);
      });

      it('should reject access by non-admin', async () => {
        const response = await request(app)
          .get('/api/company/users')
          .set('Authorization', `Bearer ${managerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied: Insufficient role');
      });
    });
  });

  describe('OCR API Tests', () => {
    describe('GET /api/ocr/formats', () => {
      it('should get supported formats', async () => {
        const response = await request(app)
          .get('/api/ocr/formats')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(response.status).toBe(200);
        expect(response.body.supportedFormats).toBeInstanceOf(Array);
        expect(response.body.maxFileSize).toBeDefined();
        expect(response.body.maxFileSizeMB).toBeDefined();
      });
    });

    describe('POST /api/ocr/process-receipt', () => {
      it('should process receipt image', async () => {
        // Create a mock image buffer
        const mockImageBuffer = Buffer.from('mock-image-data');
        
        const response = await request(app)
          .post('/api/ocr/process-receipt')
          .set('Authorization', `Bearer ${employeeToken}`)
          .attach('receipt', mockImageBuffer, 'test-receipt.jpg');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Receipt processed successfully');
        expect(response.body.ocrResult.success).toBe(true);
        expect(response.body.ocrResult.confidence).toBeGreaterThan(0);
        expect(response.body.ocrResult.extractedData).toBeDefined();
        expect(response.body.ocrResult.expenseData).toBeDefined();
      });

      it('should reject request without image', async () => {
        const response = await request(app)
          .post('/api/ocr/process-receipt')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Receipt image is required');
      });
    });

    describe('POST /api/ocr/create-expense', () => {
      it('should create expense from receipt', async () => {
        // Create a mock image buffer
        const mockImageBuffer = Buffer.from('mock-image-data');
        
        const response = await request(app)
          .post('/api/ocr/create-expense')
          .set('Authorization', `Bearer ${employeeToken}`)
          .attach('receipt', mockImageBuffer, 'test-receipt.jpg')
          .field('category', 'Meals')
          .field('description', 'Business lunch')
          .field('date', '2024-01-15');

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Expense created from receipt successfully');
        expect(response.body.expense).toBeDefined();
        expect(response.body.expense.amount).toBeGreaterThan(0);
        expect(response.body.expense.currency).toBeDefined();
        expect(response.body.expense.category).toBe('Meals');
        expect(response.body.ocrData).toBeDefined();
      });

      it('should reject request without image', async () => {
        const response = await request(app)
          .post('/api/ocr/create-expense')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            category: 'Meals',
            description: 'Business lunch',
            date: '2024-01-15'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Receipt image is required');
      });
    });

    describe('POST /api/ocr/validate', () => {
      it('should validate receipt data', async () => {
        const validData = {
          totalAmount: 10.50,
          currency: 'USD',
          date: '2024-01-15',
          merchant: 'Test Store',
          items: [
            { description: 'Item 1', amount: 5.25 },
            { description: 'Item 2', amount: 5.25 }
          ]
        };

        const response = await request(app)
          .post('/api/ocr/validate')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send(validData);

        expect(response.status).toBe(200);
        expect(response.body.isValid).toBe(true);
        expect(response.body.errors).toHaveLength(0);
        expect(response.body.validatedData).toBeDefined();
      });

      it('should detect validation errors', async () => {
        const invalidData = {
          totalAmount: 0,
          currency: 'INVALID',
          date: '',
          merchant: '',
          items: []
        };

        const response = await request(app)
          .post('/api/ocr/validate')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send(invalidData);

        expect(response.status).toBe(200);
        expect(response.body.isValid).toBe(false);
        expect(response.body.errors.length).toBeGreaterThan(0);
        expect(response.body.validatedData).toBeNull();
      });
    });
  });

  describe('Authentication Tests', () => {
    it('should reject all company operations without token', async () => {
      const response = await request(app)
        .get('/api/company/approval-flows');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject all OCR operations without token', async () => {
      const response = await request(app)
        .get('/api/ocr/formats');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject operations with invalid token', async () => {
      const response = await request(app)
        .get('/api/company/approval-flows')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });
});
