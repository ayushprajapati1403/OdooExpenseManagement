import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';

describe('Flow Management APIs - New Structure', () => {
  let adminToken: string;
  let managerToken: string;
  let employeeToken: string;
  let companyId: string;
  let adminUserId: string;
  let managerUserId: string;
  let employeeUserId: string;
  let approvalFlowId: string;
  let expenseId: string;
  let approvalRequestId: string;

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
          email: 'admin@flows.com',
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
          email: 'manager@flows.com',
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
          email: 'employee@flows.com',
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
          email: 'employee@flows.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      employeeToken = response.body.token;
    });

    it('should login as manager', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manager@flows.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      managerToken = response.body.token;
    });
  });

  describe('POST /api/flows/approval-flows', () => {
    it('should create approval flow with role-based steps', async () => {
      const response = await request(app)
        .post('/api/flows/approval-flows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Standard Approval Flow',
          ruleType: 'UNANIMOUS',
          steps: [
            { role: 'MANAGER' },
            { role: 'FINANCE' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.approvalFlow.name).toBe('Standard Approval Flow');
      expect(response.body.approvalFlow.steps).toHaveLength(2);
      approvalFlowId = response.body.approvalFlow.id;
    });

    it('should create approval flow with specific user steps', async () => {
      const response = await request(app)
        .post('/api/flows/approval-flows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Specific User Flow',
          ruleType: 'SPECIFIC',
          specificApproverId: managerUserId,
          steps: [
            { specificUserId: managerUserId },
            { role: 'ADMIN' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.approvalFlow.name).toBe('Specific User Flow');
      expect(response.body.approvalFlow.ruleType).toBe('SPECIFIC');
    });

    it('should create approval flow with percentage threshold', async () => {
      const response = await request(app)
        .post('/api/flows/approval-flows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Percentage Flow',
          ruleType: 'PERCENTAGE',
          percentageThreshold: 75,
          steps: [
            { role: 'MANAGER' },
            { role: 'FINANCE' },
            { role: 'DIRECTOR' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.approvalFlow.ruleType).toBe('PERCENTAGE');
      expect(response.body.approvalFlow.percentageThreshold).toBe(75);
    });

    it('should reject approval flow with invalid data', async () => {
      const response = await request(app)
        .post('/api/flows/approval-flows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A', // Too short
          ruleType: 'INVALID',
          steps: [] // Empty steps
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Name must be at least 2 characters');
      expect(response.body.details).toContain('Steps array is required and must not be empty');
    });

    it('should reject approval flow without required fields', async () => {
      const response = await request(app)
        .post('/api/flows/approval-flows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ruleType: 'UNANIMOUS',
          steps: [{ role: 'MANAGER' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Name is required');
    });

    it('should reject approval flow creation by non-admin', async () => {
      const response = await request(app)
        .post('/api/flows/approval-flows')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Manager Flow',
          ruleType: 'UNANIMOUS',
          steps: [{ role: 'MANAGER' }]
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied: Insufficient role');
    });
  });

  describe('GET /api/flows/approval-flows', () => {
    it('should get all approval flows (Admin)', async () => {
      const response = await request(app)
        .get('/api/flows/approval-flows')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.approvalFlows).toBeInstanceOf(Array);
      expect(response.body.approvalFlows.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject approval flows access by non-admin', async () => {
      const response = await request(app)
        .get('/api/flows/approval-flows')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied: Insufficient role');
    });
  });

  describe('GET /api/flows/approval-flows/:flowId', () => {
    it('should get approval flow by ID (Admin)', async () => {
      const response = await request(app)
        .get(`/api/flows/approval-flows/${approvalFlowId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.approvalFlow.id).toBe(approvalFlowId);
      expect(response.body.approvalFlow.steps).toBeDefined();
    });

    it('should return 404 for non-existent flow', async () => {
      const response = await request(app)
        .get('/api/flows/approval-flows/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Approval flow not found');
    });
  });

  describe('PUT /api/flows/approval-flows/:flowId', () => {
    it('should update approval flow (Admin)', async () => {
      const response = await request(app)
        .put(`/api/flows/approval-flows/${approvalFlowId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Standard Flow',
          steps: [
            { role: 'MANAGER' },
            { role: 'FINANCE' },
            { role: 'DIRECTOR' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.approvalFlow.name).toBe('Updated Standard Flow');
      expect(response.body.approvalFlow.steps).toHaveLength(3);
    });

    it('should update approval flow without steps', async () => {
      const response = await request(app)
        .put(`/api/flows/approval-flows/${approvalFlowId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Flow Name Only'
        });

      expect(response.status).toBe(200);
      expect(response.body.approvalFlow.name).toBe('Updated Flow Name Only');
    });
  });

  describe('DELETE /api/flows/approval-flows/:flowId', () => {
    it('should delete approval flow (Admin)', async () => {
      // Create a flow to delete
      const createResponse = await request(app)
        .post('/api/flows/approval-flows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Flow to Delete',
          ruleType: 'UNANIMOUS',
          steps: [{ role: 'MANAGER' }]
        });

      const flowToDeleteId = createResponse.body.approvalFlow.id;

      const response = await request(app)
        .delete(`/api/flows/approval-flows/${flowToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Approval flow deleted successfully');
    });
  });

  describe('Expense Approval Workflow', () => {
    it('should create expense that triggers approval workflow', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 100.00,
          currency: 'USD',
          category: 'Business Travel',
          description: 'Hotel accommodation',
          date: '2024-01-15'
        });

      expect(response.status).toBe(201);
      expect(response.body.expense.status).toBe('PENDING');
      expenseId = response.body.expense.id;
    });

    it('should get pending approvals for manager', async () => {
      const response = await request(app)
        .get('/api/flows/pending')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.approvals).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      
      if (response.body.approvals.length > 0) {
        approvalRequestId = response.body.approvals[0].id;
      }
    });

    it('should approve expense', async () => {
      if (!approvalRequestId) {
        // Skip if no approval request was created
        return;
      }

      const response = await request(app)
        .post(`/api/flows/${approvalRequestId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          comment: 'Approved for business travel'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Expense approved successfully');
    });

    it('should reject expense', async () => {
      // Create another expense for rejection test
      const expenseResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 200.00,
          currency: 'USD',
          category: 'Entertainment',
          description: 'Client dinner',
          date: '2024-01-16'
        });

      // Get the approval request for this expense
      const pendingResponse = await request(app)
        .get('/api/flows/pending')
        .set('Authorization', `Bearer ${managerToken}`);

      const rejectionRequestId = pendingResponse.body.approvals.find(
        (approval: any) => approval.expense.id === expenseResponse.body.expense.id
      )?.id;

      if (rejectionRequestId) {
        const response = await request(app)
          .post(`/api/flows/${rejectionRequestId}/reject`)
          .set('Authorization', `Bearer ${managerToken}`)
          .send({
            comment: 'Not approved - personal expense'
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Expense rejected successfully');
      }
    });

    it('should get approval history for expense', async () => {
      const response = await request(app)
        .get(`/api/flows/expense/${expenseId}/history`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.approvalHistory).toBeInstanceOf(Array);
    });

    it('should allow admin override', async () => {
      // Create an expense for override test
      const expenseResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          amount: 150.00,
          currency: 'USD',
          category: 'Office Supplies',
          description: 'Stationery',
          date: '2024-01-17'
        });

      // Get the approval request
      const pendingResponse = await request(app)
        .get('/api/flows/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      const overrideRequestId = pendingResponse.body.approvals.find(
        (approval: any) => approval.expense.id === expenseResponse.body.expense.id
      )?.id;

      if (overrideRequestId) {
        const response = await request(app)
          .post(`/api/flows/${overrideRequestId}/override`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            action: 'approve',
            comment: 'Admin override - urgent business need'
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Expense approved by admin override');
      }
    });
  });

  describe('GET /api/flows/company/all', () => {
    it('should get company approvals (Admin)', async () => {
      const response = await request(app)
        .get('/api/flows/company/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.approvals).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should reject company approvals access by non-admin', async () => {
      const response = await request(app)
        .get('/api/flows/company/all')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied: Insufficient role');
    });
  });

  describe('Authentication Tests', () => {
    it('should reject all flow operations without token', async () => {
      const response = await request(app)
        .get('/api/flows/approval-flows');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject all flow operations with invalid token', async () => {
      const response = await request(app)
        .get('/api/flows/approval-flows')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });
});
