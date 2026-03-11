;(async () => {
  try {
    const payload = {
      name: 'CLI Test',
      email: `cli-test-${Date.now()}@example.com`,
      password: 'Testpass1',
      phone: '9876543210'
    };
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // no timeout support in fetch here
    });
    const data = await res.text();
    console.log('STATUS', res.status);
    try { console.log('DATA', JSON.stringify(JSON.parse(data), null, 2)); } catch(e){ console.log('DATA_RAW', data); }
  } catch (err) {
    console.error('REQUEST ERROR', err && (err.stack || err));
  }
})();
