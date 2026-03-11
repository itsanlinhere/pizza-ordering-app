(async () => {
  try {
    const base = 'http://localhost:5000/api';
    const res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@demo.com', password: 'password123' })
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    try { console.log('DATA', JSON.stringify(JSON.parse(text), null, 2)); } catch(e){ console.log('DATA_RAW', text); }
  } catch (err) {
    console.error('REQUEST ERROR', err && (err.stack || err));
  }
})();
