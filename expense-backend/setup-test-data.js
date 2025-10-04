const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('🚀 Setting up test data...');

    // Check existing users
    const existingUsers = await prisma.user.findMany();
    console.log(`📊 Found ${existingUsers.length} existing users:`);
    existingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    // Check existing companies
    const existingCompanies = await prisma.company.findMany();
    console.log(`🏢 Found ${existingCompanies.length} existing companies:`);
    existingCompanies.forEach(company => {
      console.log(`  - ${company.name} (${company.currency})`);
    });

    // Create test company if none exists
    let testCompany;
    if (existingCompanies.length === 0) {
      console.log('📝 Creating test company...');
      testCompany = await prisma.company.create({
        data: {
          name: 'Test Company Inc.',
          currency: 'USD',
          country: 'United States',
          website: 'https://testcompany.com',
          industry: 'Technology',
          size: '51-200',
          address: '123 Test Street, Test City, TC 12345',
          timezone: 'America/New_York',
          fiscalYearStart: '2024-01-01'
        }
      });
      console.log(`✅ Created company: ${testCompany.name}`);
    } else {
      testCompany = existingCompanies[0];
      console.log(`✅ Using existing company: ${testCompany.name}`);
    }

    // Create test users if they don't exist
    const testUsers = [
      {
        email: 'admin@testcompany.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'ADMIN'
      },
      {
        email: 'manager@testcompany.com',
        password: 'manager123',
        name: 'Manager User',
        role: 'MANAGER'
      },
      {
        email: 'employee@testcompany.com',
        password: 'employee123',
        name: 'Employee User',
        role: 'EMPLOYEE'
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            companyId: testCompany.id,
            isManagerApprover: userData.role === 'MANAGER'
          }
        });
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`ℹ️  User already exists: ${userData.email} (${userData.role})`);
      }
    }

    // Create test expenses
    const employee = await prisma.user.findUnique({
      where: { email: 'employee@testcompany.com' }
    });

    if (employee) {
      const existingExpenses = await prisma.expense.findMany({
        where: { userId: employee.id }
      });

      if (existingExpenses.length === 0) {
        console.log('📝 Creating test expenses...');
        
        const testExpenses = [
          {
            amount: 50.00,
            currency: 'USD',
            category: 'Meals',
            description: 'Business lunch with client',
            date: new Date('2024-01-15')
          },
          {
            amount: 25.00,
            currency: 'USD',
            category: 'Transport',
            description: 'Taxi to meeting',
            date: new Date('2024-01-16')
          },
          {
            amount: 100.00,
            currency: 'USD',
            category: 'Other',
            description: 'Office supplies',
            date: new Date('2024-01-17')
          }
        ];

        for (const expenseData of testExpenses) {
          const expense = await prisma.expense.create({
            data: {
              ...expenseData,
              companyId: testCompany.id,
              userId: employee.id,
              status: 'PENDING'
            }
          });
          console.log(`✅ Created expense: $${expense.amount} - ${expense.description}`);
        }
      } else {
        console.log(`ℹ️  Employee already has ${existingExpenses.length} expenses`);
      }
    }

    console.log('\n🎉 Test data setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('┌─────────────────────┬──────────────┬─────────────┐');
    console.log('│ Email               │ Password     │ Role        │');
    console.log('├─────────────────────┼──────────────┼─────────────┤');
    console.log('│ admin@testcompany.com │ admin123    │ ADMIN       │');
    console.log('│ manager@testcompany.com │ manager123 │ MANAGER     │');
    console.log('│ employee@testcompany.com │ employee123 │ EMPLOYEE   │');
    console.log('└─────────────────────┴──────────────┴─────────────┘');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
