import request from 'supertest';
import app from '../server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
describe('Authentication APIs', () => {
    let adminToken;
    let employeeToken;
    let managerToken;
    let companyId;
    let adminUserId;
    let employeeUserId;
    let managerUserId;
    beforeAll(async () => {
        // Clean up any existing test data
        await prisma.approvalRequest.deleteMany();
        await prisma.expense.deleteMany();
        await prisma.user.deleteMany();
        await prisma.company.deleteMany();
    });
    afterAll(async () => {
        // Clean up test data
        await prisma.approvalRequest.deleteMany();
        await prisma.expense.deleteMany();
        await prisma.user.deleteMany();
        await prisma.company.deleteMany();
        await prisma.$disconnect();
    });
    describe('POST /api/auth/signup', () => {
        it('should create company and admin user on signup', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                email: 'admin@test.com',
                password: 'password123',
                name: 'Admin User',
                country: 'United States'
            });
            expect(response.status).toBe(201);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.role).toBe('ADMIN');
            expect(response.body.company.country).toBe('United States');
            adminToken = response.body.token;
            companyId = response.body.company.id;
            adminUserId = response.body.user.id;
        });
        it('should reject signup with existing email', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                email: 'admin@test.com',
                password: 'password123',
                name: 'Another Admin',
                country: 'Canada'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('User already exists');
        });
        it('should reject signup with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                email: 'test@test.com',
                password: 'password123'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Email, password, and country are required');
        });
    });
    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'admin@test.com',
                password: 'password123'
            });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('admin@test.com');
        });
        it('should reject login with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'admin@test.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
        it('should reject login with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'admin@test.com'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Email and password are required');
        });
    });
    describe('GET /api/auth/profile', () => {
        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe('admin@test.com');
            expect(response.body.company.id).toBe(companyId);
        });
        it('should reject profile request without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile');
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access token required');
        });
    });
});
describe('User Management APIs', () => {
    let adminToken;
    let companyId;
    beforeAll(async () => {
        // Get admin token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
            email: 'admin@test.com',
            password: 'password123'
        });
        adminToken = loginResponse.body.token;
        companyId = loginResponse.body.company.id;
    });
    describe('POST /api/users', () => {
        it('should create employee user', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                email: 'employee@test.com',
                password: 'password123',
                name: 'Employee User',
                role: 'EMPLOYEE'
            });
            expect(response.status).toBe(201);
            expect(response.body.user.role).toBe('EMPLOYEE');
        });
        it('should create manager user', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                email: 'manager@test.com',
                password: 'password123',
                name: 'Manager User',
                role: 'MANAGER',
                isManagerApprover: true
            });
            expect(response.status).toBe(201);
            expect(response.body.user.role).toBe('MANAGER');
            expect(response.body.user.isManagerApprover).toBe(true);
        });
        it('should reject user creation without admin role', async () => {
            // Create employee token
            const employeeLogin = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'employee@test.com',
                password: 'password123'
            });
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${employeeLogin.body.token}`)
                .send({
                email: 'test@test.com',
                password: 'password123',
                name: 'Test User',
                role: 'EMPLOYEE'
            });
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Admin access required');
        });
    });
    describe('GET /api/users', () => {
        it('should get all users in company', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.users).toBeInstanceOf(Array);
            expect(response.body.users.length).toBeGreaterThan(0);
        });
    });
    describe('PUT /api/users/:userId/role', () => {
        it('should update user role', async () => {
            // Get a user ID
            const usersResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);
            const userId = usersResponse.body.users[0].id;
            const response = await request(app)
                .put(`/api/users/${userId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                role: 'MANAGER',
                isManagerApprover: true
            });
            expect(response.status).toBe(200);
            expect(response.body.user.role).toBe('MANAGER');
        });
    });
});
describe('Expense APIs', () => {
    let employeeToken;
    let managerToken;
    let adminToken;
    let companyId;
    beforeAll(async () => {
        // Login as different users
        const employeeLogin = await request(app)
            .post('/api/auth/login')
            .send({
            email: 'employee@test.com',
            password: 'password123'
        });
        const managerLogin = await request(app)
            .post('/api/auth/login')
            .send({
            email: 'manager@test.com',
            password: 'password123'
        });
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
            email: 'admin@test.com',
            password: 'password123'
        });
        employeeToken = employeeLogin.body.token;
        managerToken = managerLogin.body.token;
        adminToken = adminLogin.body.token;
        companyId = employeeLogin.body.company.id;
    });
    describe('POST /api/expenses', () => {
        it('should submit expense', async () => {
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
                    { amount: 40.00, description: 'Food' },
                    { amount: 10.00, description: 'Tip' }
                ]
            });
            expect(response.status).toBe(201);
            expect(response.body.expense.amount).toBe(50.00);
            expect(response.body.expense.category).toBe('Meals');
        });
        it('should reject expense submission with missing fields', async () => {
            const response = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 50.00,
                currency: 'USD'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Amount, currency, category, and date are required');
        });
    });
    describe('GET /api/expenses/my-expenses', () => {
        it('should get user expenses', async () => {
            const response = await request(app)
                .get('/api/expenses/my-expenses')
                .set('Authorization', `Bearer ${employeeToken}`);
            expect(response.status).toBe(200);
            expect(response.body.expenses).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
        });
        it('should filter expenses by status', async () => {
            const response = await request(app)
                .get('/api/expenses/my-expenses?status=PENDING')
                .set('Authorization', `Bearer ${employeeToken}`);
            expect(response.status).toBe(200);
            expect(response.body.expenses).toBeInstanceOf(Array);
        });
    });
    describe('GET /api/expenses/:expenseId', () => {
        it('should get expense by ID', async () => {
            // First create an expense
            const expenseResponse = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 25.00,
                currency: 'USD',
                category: 'Transportation',
                description: 'Taxi ride',
                date: '2024-01-16'
            });
            const expenseId = expenseResponse.body.expense.id;
            const response = await request(app)
                .get(`/api/expenses/${expenseId}`)
                .set('Authorization', `Bearer ${employeeToken}`);
            expect(response.status).toBe(200);
            expect(response.body.expense.id).toBe(expenseId);
        });
    });
    describe('PUT /api/expenses/:expenseId', () => {
        it('should update pending expense', async () => {
            // Create an expense first
            const expenseResponse = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 30.00,
                currency: 'USD',
                category: 'Office Supplies',
                description: 'Stationery',
                date: '2024-01-17'
            });
            const expenseId = expenseResponse.body.expense.id;
            const response = await request(app)
                .put(`/api/expenses/${expenseId}`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 35.00,
                description: 'Updated stationery purchase'
            });
            expect(response.status).toBe(200);
            expect(response.body.expense.amount).toBe(35.00);
        });
    });
    describe('DELETE /api/expenses/:expenseId', () => {
        it('should delete pending expense', async () => {
            // Create an expense first
            const expenseResponse = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 20.00,
                currency: 'USD',
                category: 'Miscellaneous',
                description: 'Test expense',
                date: '2024-01-18'
            });
            const expenseId = expenseResponse.body.expense.id;
            const response = await request(app)
                .delete(`/api/expenses/${expenseId}`)
                .set('Authorization', `Bearer ${employeeToken}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Expense deleted successfully');
        });
    });
});
describe('Approval APIs', () => {
    let managerToken;
    let adminToken;
    let employeeToken;
    beforeAll(async () => {
        // Login as different users
        const managerLogin = await request(app)
            .post('/api/auth/login')
            .send({
            email: 'manager@test.com',
            password: 'password123'
        });
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
            email: 'admin@test.com',
            password: 'password123'
        });
        const employeeLogin = await request(app)
            .post('/api/auth/login')
            .send({
            email: 'employee@test.com',
            password: 'password123'
        });
        managerToken = managerLogin.body.token;
        adminToken = adminLogin.body.token;
        employeeToken = employeeLogin.body.token;
    });
    describe('GET /api/approvals/pending', () => {
        it('should get pending approvals for manager', async () => {
            const response = await request(app)
                .get('/api/approvals/pending')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(response.status).toBe(200);
            expect(response.body.approvals).toBeInstanceOf(Array);
        });
    });
    describe('POST /api/approvals/:requestId/approve', () => {
        it('should approve expense', async () => {
            // First create an expense that needs approval
            const expenseResponse = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 100.00,
                currency: 'USD',
                category: 'Business Travel',
                description: 'Hotel stay',
                date: '2024-01-20'
            });
            // Get pending approvals
            const pendingResponse = await request(app)
                .get('/api/approvals/pending')
                .set('Authorization', `Bearer ${managerToken}`);
            if (pendingResponse.body.approvals.length > 0) {
                const requestId = pendingResponse.body.approvals[0].id;
                const response = await request(app)
                    .post(`/api/approvals/${requestId}/approve`)
                    .set('Authorization', `Bearer ${managerToken}`)
                    .send({
                    comment: 'Approved for business travel'
                });
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Expense approved successfully');
            }
        });
    });
    describe('POST /api/approvals/:requestId/reject', () => {
        it('should reject expense', async () => {
            // Create an expense
            const expenseResponse = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 200.00,
                currency: 'USD',
                category: 'Entertainment',
                description: 'Client dinner',
                date: '2024-01-21'
            });
            // Get pending approvals
            const pendingResponse = await request(app)
                .get('/api/approvals/pending')
                .set('Authorization', `Bearer ${managerToken}`);
            if (pendingResponse.body.approvals.length > 0) {
                const requestId = pendingResponse.body.approvals[0].id;
                const response = await request(app)
                    .post(`/api/approvals/${requestId}/reject`)
                    .set('Authorization', `Bearer ${managerToken}`)
                    .send({
                    comment: 'Not business related'
                });
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Expense rejected successfully');
            }
        });
    });
});
describe('Company APIs', () => {
    let adminToken;
    beforeAll(async () => {
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
            email: 'admin@test.com',
            password: 'password123'
        });
        adminToken = adminLogin.body.token;
    });
    describe('POST /api/company/approval-flows', () => {
        it('should create approval flow', async () => {
            const response = await request(app)
                .post('/api/company/approval-flows')
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
        });
    });
    describe('GET /api/company/approval-flows', () => {
        it('should get approval flows', async () => {
            const response = await request(app)
                .get('/api/company/approval-flows')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.approvalFlows).toBeInstanceOf(Array);
        });
    });
    describe('GET /api/company/stats', () => {
        it('should get company statistics', async () => {
            const response = await request(app)
                .get('/api/company/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.stats).toBeDefined();
            expect(response.body.stats.totalUsers).toBeGreaterThan(0);
        });
    });
});
describe('OCR APIs', () => {
    let employeeToken;
    beforeAll(async () => {
        const employeeLogin = await request(app)
            .post('/api/auth/login')
            .send({
            email: 'employee@test.com',
            password: 'password123'
        });
        employeeToken = employeeLogin.body.token;
    });
    describe('POST /api/ocr/process-receipt', () => {
        it('should process receipt with OCR', async () => {
            // Create a mock image file
            const fs = require('fs');
            const path = require('path');
            // Create a simple test image file
            const testImagePath = path.join(__dirname, '../uploads/test-receipt.jpg');
            fs.writeFileSync(testImagePath, 'fake-image-data');
            const response = await request(app)
                .post('/api/ocr/process-receipt')
                .set('Authorization', `Bearer ${employeeToken}`)
                .attach('receipt', testImagePath)
                .field('category', 'Meals')
                .field('description', 'Restaurant receipt')
                .field('date', '2024-01-22');
            expect(response.status).toBe(201);
            expect(response.body.expense).toBeDefined();
            expect(response.body.ocrData).toBeDefined();
            // Clean up test file
            fs.unlinkSync(testImagePath);
        });
        it('should reject OCR processing without image', async () => {
            const response = await request(app)
                .post('/api/ocr/process-receipt')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                category: 'Meals',
                description: 'Restaurant receipt',
                date: '2024-01-22'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Receipt image is required');
        });
    });
    describe('POST /api/ocr/validate', () => {
        it('should validate OCR data', async () => {
            const response = await request(app)
                .post('/api/ocr/validate')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                ocrData: {
                    totalAmount: 45.67,
                    currency: 'USD',
                    date: '2024-01-22',
                    merchant: 'Test Restaurant',
                    items: [
                        { description: 'Food', amount: 40.00 },
                        { description: 'Tax', amount: 5.67 }
                    ]
                }
            });
            expect(response.status).toBe(200);
            expect(response.body.validation.isValid).toBe(true);
        });
        it('should reject invalid OCR data', async () => {
            const response = await request(app)
                .post('/api/ocr/validate')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                ocrData: {
                    totalAmount: -10,
                    currency: '',
                    date: ''
                }
            });
            expect(response.status).toBe(200);
            expect(response.body.validation.isValid).toBe(false);
            expect(response.body.validation.errors.length).toBeGreaterThan(0);
        });
    });
});
describe('Health Check', () => {
    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
        });
    });
});
//# sourceMappingURL=api.test.js.map