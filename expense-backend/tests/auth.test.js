import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
describe('Authentication APIs - New Structure', () => {
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
                email: 'admin@newstructure.com',
                password: 'password123',
                name: 'Admin User',
                country: 'United States'
            });
            expect(response.status).toBe(201);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.role).toBe('ADMIN');
            expect(response.body.company.country).toBe('United States');
        });
        it('should reject signup with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                email: 'invalid-email',
                password: 'password123',
                name: 'Test User',
                country: 'United States'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Invalid email format');
        });
        it('should reject signup with short password', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                email: 'test@test.com',
                password: '123',
                name: 'Test User',
                country: 'United States'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Password must be at least 6 characters');
        });
        it('should reject signup with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                email: 'test@test.com',
                password: 'password123'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Name is required');
            expect(response.body.details).toContain('Country is required');
        });
    });
    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'admin@newstructure.com',
                password: 'password123'
            });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('admin@newstructure.com');
        });
        it('should reject login with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'admin@newstructure.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
        it('should reject login with invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'invalid-email',
                password: 'password123'
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContain('Invalid email format');
        });
    });
    describe('GET /api/auth/profile', () => {
        let authToken;
        beforeAll(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'admin@newstructure.com',
                password: 'password123'
            });
            authToken = loginResponse.body.token;
        });
        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe('admin@newstructure.com');
            expect(response.body.company).toBeDefined();
        });
        it('should reject profile request without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile');
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access token required');
        });
        it('should reject profile request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token');
            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Invalid or expired token');
        });
    });
    describe('Health Check', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('OK');
            expect(response.body.environment).toBeDefined();
            expect(response.body.timestamp).toBeDefined();
        });
    });
});
//# sourceMappingURL=auth.test.js.map