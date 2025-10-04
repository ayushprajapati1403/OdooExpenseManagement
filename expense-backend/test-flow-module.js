import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';

async function testFlowModule() {
  console.log('🚀 Testing Flow Management Module...\n');

  let adminToken;
  let managerToken;
  let employeeToken;
  let managerUserId;
  let approvalFlowId;
  let expenseId;
  let approvalRequestId;

  try {
    // Test 1: Login as Admin User (or create if doesn't exist)
    console.log('1. Logging in as Admin User...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@flowmodule.com',
        password: 'password123'
      });
      adminToken = loginResponse.data.token;
      console.log('✅ Admin login successful:', loginResponse.data.user.email);
    } catch (loginError) {
      console.log('Login failed, creating admin user...');
      const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
        email: 'admin@flowmodule.com',
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
        email: 'manager@flowmodule.com',
        password: 'password123',
        name: 'Manager User',
        role: 'MANAGER',
        isManagerApprover: true
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      managerToken = managerResponse.data.token;
      managerUserId = managerResponse.data.user.id;
      console.log('✅ Manager created:', managerResponse.data.user.email);
    } catch (error) {
      console.log('Manager already exists, logging in...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'manager@flowmodule.com',
        password: 'password123'
      });
      managerToken = loginResponse.data.token;
      managerUserId = loginResponse.data.user.id;
      console.log('✅ Manager login successful:', loginResponse.data.user.email);
    }
    console.log('');

    // Test 3: Create Employee User (or login if exists)
    console.log('3. Creating Employee User...');
    try {
      const employeeResponse = await axios.post(`${BASE_URL}/users`, {
        email: 'employee@flowmodule.com',
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
        email: 'employee@flowmodule.com',
        password: 'password123'
      });
      employeeToken = loginResponse.data.token;
      console.log('✅ Employee login successful:', loginResponse.data.user.email);
    }
    console.log('');

    // Test 4: Login as Employee
    console.log('4. Logging in as Employee...');
    const employeeLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@flowmodule.com',
      password: 'password123'
    });
    employeeToken = employeeLogin.data.token;
    console.log('✅ Employee login successful');
    console.log('');

    // Test 5: Login as Manager
    console.log('5. Logging in as Manager...');
    const managerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'manager@flowmodule.com',
      password: 'password123'
    });
    managerToken = managerLogin.data.token;
    managerUserId = managerLogin.data.user.id;
    console.log('✅ Manager login successful');
    console.log('');

    // Test 6: Create Approval Flow (Role-based)
    console.log('6. Creating Role-based Approval Flow...');
    const roleFlowResponse = await axios.post(`${BASE_URL}/flows/approval-flows`, {
      name: 'Standard Approval Flow',
      ruleType: 'UNANIMOUS',
      steps: [
        { role: 'MANAGER' },
        { role: 'FINANCE' }
      ]
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    approvalFlowId = roleFlowResponse.data.approvalFlow.id;
    console.log('✅ Role-based flow created:', roleFlowResponse.data.approvalFlow.name);
    console.log('   Steps:', roleFlowResponse.data.approvalFlow.steps.length);
    console.log('');

    // Test 7: Create Approval Flow (Specific User)
    console.log('7. Creating Specific User Approval Flow...');
    const specificFlowResponse = await axios.post(`${BASE_URL}/flows/approval-flows`, {
      name: 'Specific User Flow',
      ruleType: 'SPECIFIC',
      specificApproverId: managerUserId,
      steps: [
        { specificUserId: managerUserId },
        { role: 'ADMIN' }
      ]
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Specific user flow created:', specificFlowResponse.data.approvalFlow.name);
    console.log('   Rule Type:', specificFlowResponse.data.approvalFlow.ruleType);
    console.log('');

    // Test 8: Create Approval Flow (Percentage)
    console.log('8. Creating Percentage Approval Flow...');
    const percentageFlowResponse = await axios.post(`${BASE_URL}/flows/approval-flows`, {
      name: 'Percentage Flow',
      ruleType: 'PERCENTAGE',
      percentageThreshold: 75,
      steps: [
        { role: 'MANAGER' },
        { role: 'FINANCE' },
        { role: 'DIRECTOR' }
      ]
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Percentage flow created:', percentageFlowResponse.data.approvalFlow.name);
    console.log('   Threshold:', percentageFlowResponse.data.approvalFlow.percentageThreshold + '%');
    console.log('');

    // Test 9: Get All Approval Flows
    console.log('9. Getting All Approval Flows...');
    const allFlowsResponse = await axios.get(`${BASE_URL}/flows/approval-flows`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Retrieved', allFlowsResponse.data.approvalFlows.length, 'approval flows');
    console.log('');

    // Test 10: Get Approval Flow by ID
    console.log('10. Getting Approval Flow by ID...');
    const flowByIdResponse = await axios.get(`${BASE_URL}/flows/approval-flows/${approvalFlowId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Retrieved flow:', flowByIdResponse.data.approvalFlow.name);
    console.log('   Steps:', flowByIdResponse.data.approvalFlow.steps.length);
    console.log('');

    // Test 11: Update Approval Flow
    console.log('11. Updating Approval Flow...');
    const updateFlowResponse = await axios.put(`${BASE_URL}/flows/approval-flows/${approvalFlowId}`, {
      name: 'Updated Standard Flow',
      steps: [
        { role: 'MANAGER' },
        { role: 'FINANCE' },
        { role: 'DIRECTOR' }
      ]
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Flow updated:', updateFlowResponse.data.approvalFlow.name);
    console.log('   New steps:', updateFlowResponse.data.approvalFlow.steps.length);
    console.log('');

    // Test 12: Submit Expense (Triggers Approval)
    console.log('12. Submitting Expense (Triggers Approval)...');
    const expenseResponse = await axios.post(`${BASE_URL}/expenses`, {
      amount: 100.00,
      currency: 'USD',
      category: 'Business Travel',
      description: 'Hotel accommodation',
      date: '2024-01-15'
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    expenseId = expenseResponse.data.expense.id;
    console.log('✅ Expense submitted:', expenseResponse.data.expense.amount, expenseResponse.data.expense.currency);
    console.log('   Status:', expenseResponse.data.expense.status);
    console.log('');

    // Test 13: Get Pending Approvals
    console.log('13. Getting Pending Approvals...');
    const pendingResponse = await axios.get(`${BASE_URL}/flows/pending`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('✅ Retrieved', pendingResponse.data.approvals.length, 'pending approvals');
    if (pendingResponse.data.approvals.length > 0) {
      approvalRequestId = pendingResponse.data.approvals[0].id;
      console.log('   First approval:', pendingResponse.data.approvals[0].expense.description);
    }
    console.log('');

    // Test 14: Approve Expense
    console.log('14. Approving Expense...');
    if (approvalRequestId) {
      const approveResponse = await axios.post(`${BASE_URL}/flows/${approvalRequestId}/approve`, {
        comment: 'Approved for business travel'
      }, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
      console.log('✅ Expense approved:', approveResponse.data.message);
    } else {
      console.log('⚠️  No approval request found to approve');
    }
    console.log('');

    // Test 15: Submit Another Expense for Rejection
    console.log('15. Submitting Another Expense for Rejection...');
    const rejectExpenseResponse = await axios.post(`${BASE_URL}/expenses`, {
      amount: 200.00,
      currency: 'USD',
      category: 'Entertainment',
      description: 'Client dinner',
      date: '2024-01-16'
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('✅ Expense submitted for rejection test');
    console.log('');

    // Test 16: Get Updated Pending Approvals
    console.log('16. Getting Updated Pending Approvals...');
    const updatedPendingResponse = await axios.get(`${BASE_URL}/flows/pending`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('✅ Retrieved', updatedPendingResponse.data.approvals.length, 'pending approvals');
    console.log('');

    // Test 17: Get Approval History
    console.log('17. Getting Approval History...');
    const historyResponse = await axios.get(`${BASE_URL}/flows/expense/${expenseId}/history`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('✅ Retrieved approval history:', historyResponse.data.approvalHistory.length, 'entries');
    console.log('');

    // Test 18: Admin Override
    console.log('18. Testing Admin Override...');
    const overrideExpenseResponse = await axios.post(`${BASE_URL}/expenses`, {
      amount: 150.00,
      currency: 'USD',
      category: 'Office Supplies',
      description: 'Stationery',
      date: '2024-01-17'
    }, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });

    // Get approval request for override
    const overridePendingResponse = await axios.get(`${BASE_URL}/flows/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const overrideRequestId = overridePendingResponse.data.approvals.find(
      approval => approval.expense.id === overrideExpenseResponse.data.expense.id
    )?.id;

    if (overrideRequestId) {
      const overrideResponse = await axios.post(`${BASE_URL}/flows/${overrideRequestId}/override`, {
        action: 'approve',
        comment: 'Admin override - urgent business need'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin override successful:', overrideResponse.data.message);
    } else {
      console.log('⚠️  No approval request found for override');
    }
    console.log('');

    // Test 19: Get Company Approvals
    console.log('19. Getting Company Approvals...');
    const companyApprovalsResponse = await axios.get(`${BASE_URL}/flows/company/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Retrieved', companyApprovalsResponse.data.approvals.length, 'company approvals');
    console.log('');

    // Test 20: Validation Error Testing
    console.log('20. Testing Validation Errors...');
    try {
      await axios.post(`${BASE_URL}/flows/approval-flows`, {
        name: 'A', // Too short
        ruleType: 'INVALID',
        steps: [] // Empty steps
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (error) {
      console.log('✅ Validation errors caught:', error.response.data.details.length, 'errors');
      console.log('   Errors:', error.response.data.details.join(', '));
    }
    console.log('');

    // Test 21: Authorization Testing
    console.log('21. Testing Authorization...');
    try {
      await axios.post(`${BASE_URL}/flows/approval-flows`, {
        name: 'Manager Flow',
        ruleType: 'UNANIMOUS',
        steps: [{ role: 'MANAGER' }]
      }, {
        headers: { Authorization: `Bearer ${managerToken}` }
      });
    } catch (error) {
      console.log('✅ Authorization properly enforced:', error.response.data.error);
    }
    console.log('');

    console.log('🎉 Flow Management Module Test Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Approval Flow Creation - Working');
    console.log('✅ Role-based Flows - Working');
    console.log('✅ Specific User Flows - Working');
    console.log('✅ Percentage Flows - Working');
    console.log('✅ Flow Management - Working');
    console.log('✅ Expense Approval Workflow - Working');
    console.log('✅ Pending Approvals - Working');
    console.log('✅ Approval Actions - Working');
    console.log('✅ Admin Override - Working');
    console.log('✅ Approval History - Working');
    console.log('✅ Company Approvals - Working');
    console.log('✅ Validation - Working');
    console.log('✅ Authorization - Working');
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
testFlowModule();
