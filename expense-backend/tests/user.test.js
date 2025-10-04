import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
describe('User Management APIs - New Structure', () => {
    let adminToken;
    let managerToken;
    let employeeToken;
    let companyId;
    let adminUserId;
    let managerUserId;
    let employeeUserId;
    beforeAll(async () => {
        // Clean up any existing test data
        await prisma.approvalRequest.deleteMany();
        await prisma.expense.deleteMany();
        await prisma.managerRelation.deleteMany();
        await prisma.user.deleteMany();
        await prisma.company.deleteMany();
    });
    afterAll(async () => {
        // Clean up test data
        await prisma.approvalRequest.deleteMany();
        await prisma.expense.deleteMany();
        await prisma.managerRelation.deleteMany();
        await prisma.user.deleteMany();
        await prisma.company.deleteMany();
        await prisma.$disconnect();
    });
    describe('Setup - Create Admin User', () => {
        it('should create admin user for testing', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                email: 'admin@users.com',
                password: 'password123',
                name: 'Admin User',
                country: 'United States'
            });
            expect(response.status).toBe(201);
            adminToken = response.body.token;
            companyId = response.body.company.id;
            adminUserId = response.body.user.id;
        });
    });
    describe('POST /api/users', () => {
        it('should create employee user', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                email: 'employee@users.com',
                password: 'password123',
                name: 'Employee User',
                role: 'EMPLOYEE'
            });
            expect(response.status).toBe(201);
            expect(response.body.user.role).toBe('EMPLOYEE');
            employeeUserId = response.body.user.id;
        });
        it('should create manager user', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                email: 'manager@users.com',
                password: 'password123',
                name: 'Manager User',
                role: 'MANAGER',
                isManagerApprover: true
            });
            expect(response.status).toBe(201);
            expect(response.body.user.role).toBe('MANAGER');
            expect(response.body.user.isManagerApprover).toBe(true);
            managerUserId = response.body.user.id;
        });
        it('should create user with manager relationship', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                email: 'employee2@users.com',
                password: 'password123',
                name: 'Employee 2',
                role: 'EMPLOYEE',
                managerId: managerUserId
            });
            expect(response.status).toBe(201);
            expect(response.body.user.role).toBe('EMPLOYEE');
        });
        it('should reject user creation with invalid email', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                email: 'invalid-email',
                password: 'password123',
                name: 'Test User',
                role: 'EMPLOYEE'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Invalid email format');
        });
        it('should reject user creation with invalid role', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                email: 'test@test.com',
                password: 'password123',
                name: 'Test User',
                role: 'INVALID_ROLE'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Role must be one of: ADMIN, MANAGER, EMPLOYEE, FINANCE, DIRECTOR');
        });
        it('should reject user creation without admin role', async () => {
            // Login as employee
            const employeeLogin = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'employee@users.com',
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
            expect(response.body.error).toBe('Insufficient permissions');
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
        it('should reject get users without admin role', async () => {
            // Login as employee
            const employeeLogin = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'employee@users.com',
                password: 'password123'
            });
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${employeeLogin.body.token}`);
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Insufficient permissions');
        });
    });
    describe('GET /api/users/:userId', () => {
        it('should get user by ID', async () => {
            const response = await request(app)
                .get(`/api/users/${employeeUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.user.id).toBe(employeeUserId);
            expect(response.body.user.email).toBe('employee@users.com');
        });
        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/api/users/non-existent-id')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });
    describe('PUT /api/users/:userId/role', () => {
        it('should update user role', async () => {
            const response = await request(app)
                .put(`/api/users/${employeeUserId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                role: 'MANAGER',
                isManagerApprover: true
            });
            expect(response.status).toBe(200);
            expect(response.body.user.role).toBe('MANAGER');
            expect(response.body.user.isManagerApprover).toBe(true);
        });
        it('should reject invalid role update', async () => {
            const response = await request(app)
                .put(`/api/users/${employeeUserId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                role: 'INVALID_ROLE'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
        });
    });
    describe('POST /api/users/:userId/manager', () => {
        it('should assign manager relationship', async () => {
            const response = await request(app)
                .post(`/api/users/${employeeUserId}/manager`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                managerId: managerUserId
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Manager relationship assigned successfully');
        });
        it('should reject manager assignment without manager ID', async () => {
            const response = await request(app)
                .post(`/api/users/${employeeUserId}/manager`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Manager ID is required');
        });
    });
    describe('GET /api/users/team/members', () => {
        it('should get team members for manager', async () => {
            // Login as manager
            const managerLogin = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'manager@users.com',
                password: 'password123'
            });
            const response = await request(app)
                .get('/api/users/team/members')
                .set('Authorization', `Bearer ${managerLogin.body.token}`);
            expect(response.status).toBe(200);
            expect(response.body.teamMembers).toBeInstanceOf(Array);
        });
        it('should reject team members access without manager role', async () => {
            // Login as employee
            const employeeLogin = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'employee@users.com',
                password: 'password123'
            });
            const response = await request(app)
                .get('/api/users/team/members')
                .set('Authorization', `Bearer ${employeeLogin.body.token}`);
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Insufficient permissions');
        });
    });
    describe('DELETE /api/users/:userId', () => {
        it('should delete user', async () => {
            // Create a user to delete
            const createResponse = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                email: 'delete@test.com',
                password: 'password123',
                name: 'Delete User',
                role: 'EMPLOYEE'
            });
            const userId = createResponse.body.user.id;
            const response = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User deleted successfully');
        });
        it('should prevent deleting the last admin', async () => {
            const response = await request(app)
                .delete(`/api/users/${adminUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Cannot delete the last admin user');
        });
    });
    describe('Authentication Tests', () => {
        it('should reject all user operations without token', async () => {
            const response = await request(app)
                .get('/api/users');
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access token required');
        });
        it('should reject all user operations with invalid token', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', 'Bearer invalid-token');
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Invalid or expired token');
        });
    });
});
//# sourceMappingURL=user.test.js.map