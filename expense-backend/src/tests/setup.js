import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
beforeAll(async () => {
    // Setup test database
    console.log('Setting up test environment...');
});
afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
    console.log('Test environment cleaned up.');
});
beforeEach(async () => {
    // Clean up data before each test
    await prisma.approvalRequest.deleteMany();
    await prisma.expenseLine.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.approvalFlowStep.deleteMany();
    await prisma.approvalFlow.deleteMany();
    await prisma.managerRelation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
});
//# sourceMappingURL=setup.js.map