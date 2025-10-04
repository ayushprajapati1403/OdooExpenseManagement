import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { CurrencyService } from '../src/services/currencyService';
import { ApprovalService } from '../src/services/approvalService';
import { OCRService } from '../src/services/ocrService';
describe('Services Module - New Structure', () => {
    let adminToken;
    let managerToken;
    let employeeToken;
    let companyId;
    let adminUserId;
    let managerUserId;
    let employeeUserId;
    let expenseId;
    let approvalFlowId;
    // Service instances
    let currencyService;
    let approvalService;
    let ocrService;
    beforeAll(async () => {
        // Initialize services
        currencyService = new CurrencyService();
        approvalService = new ApprovalService();
        ocrService = new OCRService();
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
                email: 'admin@services.com',
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
                email: 'manager@services.com',
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
                email: 'employee@services.com',
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
                email: 'employee@services.com',
                password: 'password123'
            });
            expect(response.status).toBe(200);
            employeeToken = response.body.token;
        });
        it('should login as manager', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                email: 'manager@services.com',
                password: 'password123'
            });
            expect(response.status).toBe(200);
            managerToken = response.body.token;
        });
    });
    describe('CurrencyService Tests', () => {
        it('should convert USD to EUR', async () => {
            const conversion = await currencyService.convertCurrency(100, 'USD', 'EUR');
            expect(conversion.fromCurrency).toBe('USD');
            expect(conversion.toCurrency).toBe('EUR');
            expect(conversion.amount).toBe(100);
            expect(conversion.convertedAmount).toBeGreaterThan(0);
            expect(conversion.rate).toBeGreaterThan(0);
            expect(conversion.timestamp).toBeInstanceOf(Date);
        });
        it('should return same amount for same currency', async () => {
            const conversion = await currencyService.convertCurrency(100, 'USD', 'USD');
            expect(conversion.fromCurrency).toBe('USD');
            expect(conversion.toCurrency).toBe('USD');
            expect(conversion.amount).toBe(100);
            expect(conversion.convertedAmount).toBe(100);
            expect(conversion.rate).toBe(1);
        });
        it('should validate currency codes', () => {
            expect(currencyService.isValidCurrency('USD')).toBe(true);
            expect(currencyService.isValidCurrency('EUR')).toBe(true);
            expect(currencyService.isValidCurrency('INVALID')).toBe(false);
            expect(currencyService.isValidCurrency('')).toBe(false);
        });
        it('should format currency amounts', () => {
            const formatted = currencyService.formatCurrency(1234.56, 'USD');
            expect(formatted).toContain('$');
            expect(formatted).toContain('1,234.56');
        });
        it('should get currency symbols', () => {
            expect(currencyService.getCurrencySymbol('USD')).toBe('$');
            expect(currencyService.getCurrencySymbol('EUR')).toBe('€');
            expect(currencyService.getCurrencySymbol('GBP')).toBe('£');
            expect(currencyService.getCurrencySymbol('INVALID')).toBe('INVALID');
        });
        it('should get currency information', () => {
            const info = currencyService.getCurrencyInfo('USD');
            expect(info.code).toBe('USD');
            expect(info.symbol).toBe('$');
            expect(info.name).toBe('US Dollar');
        });
        it('should handle batch conversions', async () => {
            const conversions = [
                { amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' },
                { amount: 200, fromCurrency: 'USD', toCurrency: 'GBP' },
                { amount: 50, fromCurrency: 'USD', toCurrency: 'USD' }
            ];
            const results = await currencyService.batchConvert(conversions);
            expect(results).toHaveLength(3);
            expect(results[0].fromCurrency).toBe('USD');
            expect(results[0].toCurrency).toBe('EUR');
            expect(results[2].rate).toBe(1); // Same currency
        });
        it('should clear cache', () => {
            currencyService.clearCache();
            const stats = currencyService.getCacheStats();
            expect(stats.size).toBe(0);
        });
    });
    describe('ApprovalService Tests', () => {
        it('should create approval flow', async () => {
            const approvalFlow = await approvalService.createApprovalFlow(companyId, 'Test Flow', 'UNANIMOUS', [
                { role: 'MANAGER' },
                { role: 'FINANCE' }
            ]);
            expect(approvalFlow.name).toBe('Test Flow');
            expect(approvalFlow.ruleType).toBe('UNANIMOUS');
            expect(approvalFlow.steps).toHaveLength(2);
            approvalFlowId = approvalFlow.id;
        });
        it('should get approval flow', async () => {
            const flow = await approvalService.getApprovalFlow(companyId);
            expect(flow).not.toBeNull();
            expect(flow.name).toBe('Test Flow');
            expect(flow.steps).toHaveLength(2);
        });
        it('should create approval requests for expense', async () => {
            // Create an expense first
            const expense = await prisma.expense.create({
                data: {
                    companyId,
                    userId: employeeUserId,
                    amount: 100,
                    currency: 'USD',
                    amountInCompanyCurrency: 100,
                    category: 'Test',
                    description: 'Test expense',
                    date: new Date()
                }
            });
            expenseId = expense.id;
            const approvalRequests = await approvalService.createApprovalRequests(expense.id, companyId);
            expect(approvalRequests).toHaveLength(2);
            expect(approvalRequests[0].expenseId).toBe(expense.id);
            expect(approvalRequests[0].status).toBe('PENDING');
        });
        it('should get pending approvals', async () => {
            const result = await approvalService.getPendingApprovals(managerUserId, 1, 10);
            expect(result.approvals).toBeInstanceOf(Array);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
        });
        it('should check if user can approve', async () => {
            const approvalRequests = await prisma.approvalRequest.findMany({
                where: { expenseId }
            });
            if (approvalRequests.length > 0) {
                const canApprove = await approvalService.canUserApprove(managerUserId, approvalRequests[0].id);
                expect(canApprove).toBe(true);
            }
        });
        it('should process approval decision', async () => {
            const approvalRequests = await prisma.approvalRequest.findMany({
                where: { expenseId }
            });
            if (approvalRequests.length > 0) {
                const result = await approvalService.processApprovalDecision(approvalRequests[0].id, 'APPROVED', 'Test approval');
                expect(result.message).toBeDefined();
                expect(['APPROVED', 'PENDING']).toContain(result.expenseStatus);
            }
        });
        it('should get approval history', async () => {
            const history = await approvalService.getApprovalHistory(expenseId);
            expect(history).toBeInstanceOf(Array);
            expect(history.length).toBeGreaterThan(0);
        });
        it('should get company approval stats', async () => {
            const stats = await approvalService.getCompanyApprovalStats(companyId);
            expect(stats.totalApprovals).toBeGreaterThanOrEqual(0);
            expect(stats.pendingApprovals).toBeGreaterThanOrEqual(0);
            expect(stats.approvedApprovals).toBeGreaterThanOrEqual(0);
            expect(stats.rejectedApprovals).toBeGreaterThanOrEqual(0);
        });
    });
    describe('OCRService Tests', () => {
        it('should process receipt image', async () => {
            // Create a mock image buffer
            const mockImageBuffer = Buffer.from('mock-image-data');
            const result = await ocrService.processReceipt(mockImageBuffer, 'test-receipt.jpg');
            expect(result.success).toBe(true);
            expect(result.text).toBeDefined();
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.items).toBeInstanceOf(Array);
        });
        it('should extract expense data from OCR result', () => {
            const mockOCRResult = {
                success: true,
                text: 'STARBUCKS COFFEE\nGrande Latte $4.95\nTotal $4.95',
                confidence: 0.95,
                items: [{ description: 'Grande Latte', amount: 4.95 }],
                totalAmount: 4.95,
                currency: 'USD',
                date: '2024-01-15',
                merchant: 'STARBUCKS COFFEE',
                rawData: {}
            };
            const expenseData = ocrService.extractExpenseData(mockOCRResult);
            expect(expenseData.amount).toBe(4.95);
            expect(expenseData.currency).toBe('USD');
            expect(expenseData.category).toBe('Meals');
            expect(expenseData.description).toContain('STARBUCKS COFFEE');
            expect(expenseData.expenseLines).toHaveLength(1);
        });
        it('should validate receipt data', () => {
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
            const validation = ocrService.validateReceiptData(validData);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
        it('should detect validation errors', () => {
            const invalidData = {
                totalAmount: 0,
                currency: 'INVALID',
                date: '',
                merchant: '',
                items: []
            };
            const validation = ocrService.validateReceiptData(invalidData);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
        });
        it('should get supported formats', () => {
            const formats = ocrService.getSupportedFormats();
            expect(formats).toContain('image/jpeg');
            expect(formats).toContain('image/png');
            expect(formats).toContain('image/gif');
        });
        it('should get max file size', () => {
            const maxSize = ocrService.getMaxFileSize();
            expect(maxSize).toBe(10 * 1024 * 1024); // 10MB
        });
        it('should determine expense category', () => {
            // Test category determination logic
            const mockOCRResult = {
                success: true,
                text: 'STARBUCKS COFFEE\nGrande Latte $4.95\nTotal $4.95',
                confidence: 0.95,
                items: [{ description: 'Grande Latte', amount: 4.95 }],
                totalAmount: 4.95,
                currency: 'USD',
                date: '2024-01-15',
                merchant: 'STARBUCKS COFFEE',
                rawData: {
                    merchant: 'STARBUCKS COFFEE',
                    totalAmount: 4.95,
                    currency: 'USD',
                    date: '2024-01-15',
                    items: [{ description: 'Grande Latte', amount: 4.95 }]
                }
            };
            const expenseData = ocrService.extractExpenseData(mockOCRResult);
            expect(expenseData.category).toBe('Meals');
        });
    });
    describe('Service Integration Tests', () => {
        it('should integrate currency service with expense creation', async () => {
            const response = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 100.00,
                currency: 'EUR',
                category: 'Business Travel',
                description: 'Hotel accommodation',
                date: '2024-01-15'
            });
            expect(response.status).toBe(201);
            expect(response.body.expense.amount).toBe(100.00);
            expect(response.body.expense.currency).toBe('EUR');
        });
        it('should integrate approval service with expense workflow', async () => {
            // Create approval flow
            const flowResponse = await request(app)
                .post('/api/flows/approval-flows')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: 'Integration Test Flow',
                ruleType: 'UNANIMOUS',
                steps: [{ role: 'MANAGER' }]
            });
            expect(flowResponse.status).toBe(201);
            // Submit expense
            const expenseResponse = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 50.00,
                currency: 'USD',
                category: 'Office Supplies',
                description: 'Integration test expense',
                date: '2024-01-16'
            });
            expect(expenseResponse.status).toBe(201);
            // Check if approval requests were created
            const pendingResponse = await request(app)
                .get('/api/flows/pending')
                .set('Authorization', `Bearer ${managerToken}`);
            expect(pendingResponse.status).toBe(200);
            expect(pendingResponse.body.approvals).toBeInstanceOf(Array);
        });
        it('should handle service errors gracefully', async () => {
            // Test with invalid currency
            const response = await request(app)
                .post('/api/expenses')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                amount: 100.00,
                currency: 'INVALID_CURRENCY',
                category: 'Test',
                description: 'Test with invalid currency',
                date: '2024-01-15'
            });
            // Should still create expense but without conversion
            expect(response.status).toBe(201);
        });
    });
    describe('Service Performance Tests', () => {
        it('should handle batch currency conversions efficiently', async () => {
            const startTime = Date.now();
            const conversions = Array.from({ length: 10 }, (_, i) => ({
                amount: 100 + i,
                fromCurrency: 'USD',
                toCurrency: 'EUR'
            }));
            const results = await currencyService.batchConvert(conversions);
            const endTime = Date.now();
            const duration = endTime - startTime;
            expect(results).toHaveLength(10);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });
        it('should cache currency rates efficiently', async () => {
            // First conversion
            await currencyService.convertCurrency(100, 'USD', 'EUR');
            const stats1 = currencyService.getCacheStats();
            // Second conversion (should use cache)
            await currencyService.convertCurrency(200, 'USD', 'EUR');
            const stats2 = currencyService.getCacheStats();
            expect(stats2.size).toBeGreaterThanOrEqual(stats1.size);
        });
    });
});
//# sourceMappingURL=services.test.js.map