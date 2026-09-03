const testLogin = async (email, password) => {
  try {
    const res = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log(`${email} login result:`, data.success, data.error ? data.error : 'Token received');
  } catch(e) {
    console.log(`${email} login error:`, e.message);
  }
}

async function run() {
  await testLogin('SuperUser@company.com', 'admin123'); // test case insensitivity
  await testLogin('user@company.com', 'user123');
  await testLogin('inventory@company.com', 'inventory123');
  await testLogin('delivery@company.com', 'delivery123');
}

run();
