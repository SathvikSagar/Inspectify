// Test script for admin login
const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin123@gmail.com',
        password: 'admin1234567890'
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Admin login successful!');
    } else {
      console.log('❌ Admin login failed!');
    }
  } catch (error) {
    console.error('Error testing admin login:', error);
  }
}

testAdminLogin();