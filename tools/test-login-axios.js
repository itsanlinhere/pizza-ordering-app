const axios = require('axios');

(async () => {
  try {
    const base = 'http://localhost:5000/api';
    const res = await axios.post(base + '/auth/login', { email: 'test@demo.com', password: 'password123' });
    console.log('STATUS', res.status);
    console.log('DATA', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('RESPONSE ERROR', err.response.status, err.response.data);
    } else {
      console.error('REQUEST ERROR', err.message);
    }
  }
})();
