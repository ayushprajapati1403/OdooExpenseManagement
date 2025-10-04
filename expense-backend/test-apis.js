const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test data
let adminToken;
let employeeToken;
let managerToken;
let companyId;
let expenseId;

async function testAPIs() {
  console.log('🚀 Starting API Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('');

    // Test 2: Signup (Create Company & Admin)
    console.log('2. Testing Signup...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      email: 'admin@testcompany.com',
      password: 'password123',
      name: 'Test Admin',
      country: 'United States'
    });
    adminToken = signupResponse.data.token;
    companyId = signupResponse.data.company.id;
    console.log('✅ Signup successful:', signupResponse.data.user.email);
    console.log('   Company:', signupResponse.data.company.name);
    console.log('   Currency:', signupResponse.data.company.currency);
    console.log('');

    // Test 3: Login
    console.log('3. Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@testcompany.com',
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.data.user.email);
    console.log('');

    // Test 4: Create Employee
    console.log('4. Testing User Creation...');
    const employeeResponse = await axios.post(`${BASE_URL}/users`, {
      email: 'employee@testcompany.com',
      password: 'password123',
      name: 'Test Employee',
      role: 'EMPLOYEE'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Employee created:', employeeResponse.data.user.email);
    console.log('');

    // Test 5: Create Manager
    console.log('5. Testing Manager Creation...');
    const managerResponse = await axios.post(`${BASE_URL}/users`, {
      email: 'manager@testcompany.com',
      password: 'password123',
      name: 'Test Manager',
      role: 'MANAGER',
      isManagerApprover: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Manager created:', managerResponse.data.user.email);
    console.log('');

    // Test 6: Login as Employee
    console.log('6. Testing Employee Login...');
    const employeeLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@testcompany.com',
      password: 'password123'
    });
    employeeToken = employeeLogin.data.token;
    console.log('✅ Employee login successful');
    console.log('');

    // Test 7: Login as Manager
    console.log('7. Testing Manager Login...');
    const managerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'manager@testcompany.com',
      password: 'password123'
    });
    managerToken = managerLogin.data.token;
    console.log('✅ Manager login successful');
    console.log('');

    // Test 8: Submit Expense
    console.log('8. Testing Expense Submission...');
    const expenseResponse = await axios.post(`${BASE_URL}/expenses`, {
      amount: 75.50,
      currency: 'USD',
      category: 'Meals',
      description: 'Business lunch with client',
      date: '2024-01-15',
      expenseLines: [
        { amount: 65.00, description: 'Food' },
        { amount: 10.50, description: 'Tip' }
      ]
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    expenseId = expenseResponse.data.expense.id;
    console.log('✅ Expense submitted:', expenseResponse.data.expense.amount, expenseResponse.data.expense.currency);
    console.log('   Category:', expenseResponse.data.expense.category);
    console.log('   Status:', expenseResponse.data.expense.status);
    console.log('');

    // Test 9: Get User Expenses
    console.log('9. Testing Get User Expenses...');
    const expensesResponse = await axios.get(`${BASE_URL}/expenses/my-expenses`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('✅ Retrieved', expensesResponse.data.expenses.length, 'expenses');
    console.log('   Pagination:', expensesResponse.data.pagination);
    console.log('');

    // Test 10: Create Approval Flow
    console.log('10. Testing Approval Flow Creation...');
    const approvalFlowResponse = await axios.post(`${BASE_URL}/company/approval-flows`, {
      name: 'Standard Approval Flow',
      ruleType: 'UNANIMOUS',
      steps: [
        { role: 'MANAGER' },
        { role: 'FINANCE' }
      ]
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Approval flow created:', approvalFlowResponse.data.approvalFlow.name);
    console.log('   Steps:', approvalFlowResponse.data.approvalFlow.steps.length);
    console.log('');

    // Test 11: Get Pending Approvals
    console.log('11. Testing Get Pending Approvals...');
    const pendingResponse = await axios.get(`${BASE_URL}/approvals/pending`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('✅ Retrieved', pendingResponse.data.approvals.length, 'pending approvals');
    console.log('');

    // Test 12: Get Company Statistics
    console.log('12. Testing Company Statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/company/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Company Statistics:');
    console.log('   Total Users:', statsResponse.data.stats.totalUsers);
    console.log('   Total Expenses:', statsResponse.data.stats.totalExpenses);
    console.log('   Pending Expenses:', statsResponse.data.stats.pendingExpenses);
    console.log('');

    // Test 13: OCR Validation
    console.log('13. Testing OCR Validation...');
    const ocrValidationResponse = await axios.post(`${BASE_URL}/ocr/validate`, {
      ocrData: {
        totalAmount: 45.67,
        currency: 'USD',
        date: '2024-01-15',
        merchant: 'Test Restaurant',
        items: [
          { description: 'Food', amount: 40.00 },
          { description: 'Tax', amount: 5.67 }
        ]
      }
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('✅ OCR Validation:', ocrValidationResponse.data.validation.isValid ? 'Valid' : 'Invalid');
    console.log('   Errors:', ocrValidationResponse.data.validation.errors.length);
    console.log('   Warnings:', ocrValidationResponse.data.validation.warnings.length);
    console.log('');

    console.log('🎉 All API tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Authentication APIs - Working');
    console.log('✅ User Management APIs - Working');
    console.log('✅ Expense APIs - Working');
    console.log('✅ Approval APIs - Working');
    console.log('✅ Company APIs - Working');
    console.log('✅ OCR APIs - Working');
    console.log('✅ Health Check - Working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run the tests
testAPIs();
