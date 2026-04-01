const http = require('http');

const ROLES = [
  { name: 'Super Admin', email: 'admin@petbuddycentral.com', password: 'admin123', expectedUrl: '/super-admin/dashboard' },
  { name: 'Franchise Owner', email: 'owner@petbuddycentral.com', password: 'owner123', expectedUrl: '/franchise/dashboard' },
  { name: 'Store Manager', email: 'manager@petbuddycentral.com', password: 'manager123', expectedUrl: '/store/dashboard' }
];

async function testRole(role) {
  console.log(`\nTesting ${role.name}...`);
  try {
    // 1. Get CSRF token
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    let cookies = csrfRes.headers.get('set-cookie')?.split(',').map(c => c.split(';')[0]).join('; ') || '';

    // 2. Login
    const loginParams = new URLSearchParams({
      email: role.email,
      password: role.password,
      csrfToken: csrfToken,
      json: 'true'
    });
    
    const loginRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies
      },
      body: loginParams,
      redirect: 'manual'
    });

    const newCookies = loginRes.headers.get('set-cookie');
    if (newCookies) {
      cookies += '; ' + newCookies.split(',').map(c => c.split(';')[0]).join('; ');
    }

    // 3. Request expected dashboard
    const dashRes = await fetch(`http://localhost:3000${role.expectedUrl}`, {
      headers: { 'Cookie': cookies },
      redirect: 'manual'
    });

    if (dashRes.status === 200) {
      console.log(`✅ SUCCESS: ${role.name} successfully accessed ${role.expectedUrl}`);
    } else {
      console.log(`❌ FAILED: ${role.name} received status ${dashRes.status} on ${role.expectedUrl}`);
    }
  } catch (err) {
    console.error(`❌ ERROR for ${role.name}: ${err.message}`);
  }
}

async function run() {
  for (const role of ROLES) {
    await testRole(role);
  }
}
run();
