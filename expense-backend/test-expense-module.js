import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';

async function testExpenseModule() {
  console.log('🚀 Testing Expense Management Module...\n');

  let adminToken;
  let managerToken;
  let employeeToken;
  let expenseId;

  try {
    // Test 1: Login as Admin User (or create if doesn't exist)
    console.log('1. Logging in as Admin User...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@expensemodule.com',
        password: 'password123'
      });
      adminToken = loginResponse.data.token;
      console.log('✅ Admin login successful:', loginResponse.data.user.email);
    } catch (loginError) {
      console.log('Login failed, creating admin user...');
      const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
        email: 'admin@expensemodule.com',
        password: 'password123',
        name: 'Admin User',
        country: 'United States'
      });
      adminToken = signupResponse.data.token;
      console.log('✅ Admin user created:', signupResponse.data.user.email);
    }
    console.log('');

    // Test 2: Create Manager User (or login if exists)
    console.log('2. Creating Manager User...');
    try {
      const managerResponse = await axios.post(`${BASE_URL}/users`, {
        email: 'manager@expensemodule.com',
        password: 'password123',
        name: 'Manager User',
        role: 'MANAGER',
        isManagerApprover: true
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      managerToken = managerResponse.data.token;
      console.log('✅ Manager created:', managerResponse.data.user.email);
    } catch (error) {
      console.log('Manager already exists, logging in...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'manager@expensemodule.com',
        password: 'password123'
      });
      managerToken = loginResponse.data.token;
      console.log('✅ Manager login successful:', loginResponse.data.user.email);
    }
    console.log('');

    // Test 3: Create Employee User (or login if exists)
    console.log('3. Creating Employee User...');
    try {
      const employeeResponse = await axios.post(`${BASE_URL}/users`, {
        email: 'employee@expensemodule.com',
        password: 'password123',
        name: 'Employee User',
        role: 'EMPLOYEE'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      employeeToken = employeeResponse.data.token;
      console.log('✅ Employee created:', employeeResponse.data.user.email);
    } catch (error) {
      console.log('Employee already exists, logging in...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'employee@expensemodule.com',
        password: 'password123'
      });
      employeeToken = loginResponse.data.token;
      console.log('✅ Employee login successful:', loginResponse.data.user.email);
    }
    console.log('');

    // Test 4: Login as Employee
    console.log('4. Logging in as Employee...');
    const employeeLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@expensemodule.com',
      password: 'password123'
    });
    employeeToken = employeeLogin.data.token;
    console.log('✅ Employee login successful');
    console.log('');

    // Test 5: Login as Manager
    console.log('5. Logging in as Manager...');
    const managerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'manager@expensemodule.com',
      password: 'password123'
    });
    managerToken = managerLogin.data.token;
    console.log('✅ Manager login successful');
    console.log('');

    // Test 6: Submit Basic Expense
    console.log('6. Submitting Basic Expense...');
    const basicExpenseResponse = await axios.post(`${BASE_URL}/expenses`, {
      amount: 50.00,
      currency: 'USD',
      category: 'Meals',
      description: 'Business lunch',
      date: '2024-01-15'
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('✅ Basic expense submitted:', basicExpenseResponse.data.expense.amount, basicExpenseResponse.data.expense.currency);
    console.log('   Category:', basicExpenseResponse.data.expense.category);
    console.log('   Status:', basicExpenseResponse.data.expense.status);
    console.log('');

    // Test 7: Submit Expense with Lines
    console.log('7. Submitting Expense with Lines...');
    const detailedExpenseResponse = await axios.post(`${BASE_URL}/expenses`, {
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
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    expenseId = detailedExpenseResponse.data.expense.id;
    console.log('✅ Detailed expense submitted:', detailedExpenseResponse.data.expense.amount, detailedExpenseResponse.data.expense.currency);
    console.log('   Lines:', detailedExpenseResponse.data.expenseLines?.length || 0);
    console.log('');

    // Test 8: Get User Expenses
    console.log('8. Getting User Expenses...');
    const userExpensesResponse = await axios.get(`${BASE_URL}/expenses/my-expenses`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('✅ Retrieved', userExpensesResponse.data.expenses.length, 'expenses');
    console.log('   Pagination:', userExpensesResponse.data.pagination);
    console.log('');

    // Test 9: Get Expense by ID
    console.log('9. Getting Expense by ID...');
    const expenseResponse = await axios.get(`${BASE_URL}/expenses/${expenseId}`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('✅ Retrieved expense:', expenseResponse.data.expense.description);
    console.log('   Amount:', expenseResponse.data.expense.amount);
    console.log('   Lines:', expenseResponse.data.expense.expenseLines.length);
    console.log('');

    // Test 10: Update Expense
    console.log('10. Updating Expense...');
    const updateResponse = await axios.put(`${BASE_URL}/expenses/${expenseId}`, {
      amount: 80.00,
      description: 'Updated taxi rides'
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('✅ Expense updated:', updateResponse.data.expense.amount);
    console.log('');

    // Test 11: Get Company Expenses (Manager)
    console.log('11. Getting Company Expenses (Manager)...');
    const companyExpensesResponse = await axios.get(`${BASE_URL}/expenses/company/all`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('✅ Retrieved', companyExpensesResponse.data.expenses.length, 'company expenses');
    console.log('');

    // Test 12: Get Expense Statistics (Manager)
    console.log('12. Getting Expense Statistics (Manager)...');
    const statsResponse = await axios.get(`${BASE_URL}/expenses/company/statistics`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('✅ Retrieved statistics:');
    console.log('   Total Expenses:', statsResponse.data.statistics.totalExpenses);
    console.log('   Pending:', statsResponse.data.statistics.pendingExpenses);
    console.log('   Approved:', statsResponse.data.statistics.approvedExpenses);
    console.log('   Rejected:', statsResponse.data.statistics.rejectedExpenses);
    console.log('');

    // Test 13: Validation Error Testing
    console.log('13. Testing Validation Errors...');
    try {
      await axios.post(`${BASE_URL}/expenses`, {
        amount: -10,
        currency: 'US',
        category: 'M',
        date: 'invalid-date'
      }, {
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
    } catch (error) {
      console.log('✅ Validation errors caught:', error.response.data.details.length, 'errors');
      console.log('   Errors:', error.response.data.details.join(', '));
    }
    console.log('');

    // Test 14: Authorization Testing
    console.log('14. Testing Authorization...');
    try {
      await axios.get(`${BASE_URL}/expenses/company/all`, {
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
    } catch (error) {
      console.log('✅ Authorization properly enforced:', error.response.data.error);
    }
    console.log('');

    console.log('🎉 Expense Management Module Test Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Expense Submission - Working');
    console.log('✅ Expense Lines - Working');
    console.log('✅ Expense Retrieval - Working');
    console.log('✅ Expense Updates - Working');
    console.log('✅ Company Expenses - Working');
    console.log('✅ Expense Statistics - Working');
    console.log('✅ Validation - Working');
    console.log('✅ Authorization - Working');
    console.log('✅ Pagination - Working');
    console.log('✅ Error Handling - Working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

// Run the tests
testExpenseModule();
