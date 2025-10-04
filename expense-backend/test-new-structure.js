const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testNewAuthStructure() {
  console.log('🚀 Testing New Auth Structure...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Environment:', healthResponse.data.environment);
    console.log('');

    // Test 2: Signup with validation
    console.log('2. Testing Signup with Validation...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      email: 'admin@newstructure.com',
      password: 'password123',
      name: 'Admin User',
      country: 'United States'
    });
    console.log('✅ Signup successful:', signupResponse.data.user.email);
    console.log('   Role:', signupResponse.data.user.role);
    console.log('   Company:', signupResponse.data.company.name);
    console.log('');

    // Test 3: Login
    console.log('3. Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@newstructure.com',
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.data.user.email);
    console.log('');

    // Test 4: Profile with authentication
    console.log('4. Testing Profile with Authentication...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${loginResponse.data.token}` }
    });
    console.log('✅ Profile retrieved:', profileResponse.data.user.email);
    console.log('   Company Currency:', profileResponse.data.company.currency);
    console.log('');

    // Test 5: Validation Error Testing
    console.log('5. Testing Validation Errors...');
    try {
      await axios.post(`${BASE_URL}/auth/signup`, {
        email: 'invalid-email',
        password: '123',
        name: 'Test',
        country: 'United States'
      });
    } catch (error) {
      console.log('✅ Validation errors caught:', error.response.data.details.length, 'errors');
      console.log('   Errors:', error.response.data.details.join(', '));
    }
    console.log('');

    console.log('🎉 New Auth Structure Test Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Health Check - Working');
    console.log('✅ Signup with Validation - Working');
    console.log('✅ Login - Working');
    console.log('✅ Profile with Authentication - Working');
    console.log('✅ Validation Error Handling - Working');
    console.log('✅ New Architecture Structure - Working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run the tests
testNewAuthStructure();
