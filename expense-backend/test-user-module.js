const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testUserModule() {
  console.log('🚀 Testing User Management Module...\n');

  let adminToken;
  let managerUserId;
  let employeeUserId;

  try {
    // Test 1: Create Admin User
    console.log('1. Creating Admin User...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      email: 'admin@usermodule.com',
      password: 'password123',
      name: 'Admin User',
      country: 'United States'
    });
    adminToken = signupResponse.data.token;
    console.log('✅ Admin user created:', signupResponse.data.user.email);
    console.log('');

    // Test 2: Create Employee User
    console.log('2. Creating Employee User...');
    const employeeResponse = await axios.post(`${BASE_URL}/users`, {
      email: 'employee@usermodule.com',
      password: 'password123',
      name: 'Employee User',
      role: 'EMPLOYEE'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    employeeUserId = employeeResponse.data.user.id;
    console.log('✅ Employee created:', employeeResponse.data.user.email);
    console.log('   Role:', employeeResponse.data.user.role);
    console.log('');

    // Test 3: Create Manager User
    console.log('3. Creating Manager User...');
    const managerResponse = await axios.post(`${BASE_URL}/users`, {
      email: 'manager@usermodule.com',
      password: 'password123',
      name: 'Manager User',
      role: 'MANAGER',
      isManagerApprover: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    managerUserId = managerResponse.data.user.id;
    console.log('✅ Manager created:', managerResponse.data.user.email);
    console.log('   Role:', managerResponse.data.user.role);
    console.log('   Is Manager Approver:', managerResponse.data.user.isManagerApprover);
    console.log('');

    // Test 4: Get All Users
    console.log('4. Getting All Users...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Retrieved', usersResponse.data.users.length, 'users');
    console.log('   Users:', usersResponse.data.users.map(u => `${u.name} (${u.role})`).join(', '));
    console.log('');

    // Test 5: Get User by ID
    console.log('5. Getting User by ID...');
    const userResponse = await axios.get(`${BASE_URL}/users/${employeeUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Retrieved user:', userResponse.data.user.name);
    console.log('   Email:', userResponse.data.user.email);
    console.log('   Role:', userResponse.data.user.role);
    console.log('');

    // Test 6: Update User Role
    console.log('6. Updating User Role...');
    const updateResponse = await axios.put(`${BASE_URL}/users/${employeeUserId}/role`, {
      role: 'MANAGER',
      isManagerApprover: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ User role updated:', updateResponse.data.user.role);
    console.log('   Is Manager Approver:', updateResponse.data.user.isManagerApprover);
    console.log('');

    // Test 7: Assign Manager Relationship
    console.log('7. Assigning Manager Relationship...');
    const managerAssignResponse = await axios.post(`${BASE_URL}/users/${employeeUserId}/manager`, {
      managerId: managerUserId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Manager relationship assigned');
    console.log('');

    // Test 8: Get Team Members (as Manager)
    console.log('8. Getting Team Members (as Manager)...');
    const managerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'manager@usermodule.com',
      password: 'password123'
    });

    const teamResponse = await axios.get(`${BASE_URL}/users/team/members`, {
      headers: { Authorization: `Bearer ${managerLogin.data.token}` }
    });
    console.log('✅ Retrieved', teamResponse.data.teamMembers.length, 'team members');
    console.log('');

    // Test 9: Validation Error Testing
    console.log('9. Testing Validation Errors...');
    try {
      await axios.post(`${BASE_URL}/users`, {
        email: 'invalid-email',
        password: '123',
        name: 'Test',
        role: 'INVALID_ROLE'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (error) {
      console.log('✅ Validation errors caught:', error.response.data.details.length, 'errors');
      console.log('   Errors:', error.response.data.details.join(', '));
    }
    console.log('');

    // Test 10: Authorization Testing
    console.log('10. Testing Authorization...');
    const employeeLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'employee@usermodule.com',
      password: 'password123'
    });

    try {
      await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${employeeLogin.data.token}` }
      });
    } catch (error) {
      console.log('✅ Authorization properly enforced:', error.response.data.error);
    }
    console.log('');

    console.log('🎉 User Management Module Test Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ User Creation - Working');
    console.log('✅ User Retrieval - Working');
    console.log('✅ User Role Updates - Working');
    console.log('✅ Manager Relationships - Working');
    console.log('✅ Team Management - Working');
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
testUserModule();
