(async () => {
  try {
    const baseUrl = 'http://localhost:5000/api';

    // Login as test user
    let res = await fetch(baseUrl + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@demo.com', password: 'password123' })
    });
    const loginText = await res.text();
    const login = JSON.parse(loginText);
    console.log('Login status', res.status, login.message || login);
    if (!login.success) return;
    const token = login.data.token;

    // Fetch products
    const [bRes, sRes, cRes, vRes, mRes] = await Promise.all([
      fetch(baseUrl + '/pizza/bases'),
      fetch(baseUrl + '/pizza/sauces'),
      fetch(baseUrl + '/pizza/cheeses'),
      fetch(baseUrl + '/pizza/veggies'),
      fetch(baseUrl + '/pizza/meats')
    ]);
    const [bases, sauces, cheeses, veggies, meats] = await Promise.all([bRes.json(), sRes.json(), cRes.json(), vRes.json(), mRes.json()]);
    console.log('Products fetched:', bases.success, sauces.success, cheeses.success);

    const firstBase = bases.data[0];
    const firstSauce = sauces.data[0];
    const firstCheese = cheeses.data[0];
    const veggieIds = (veggies.data || []).slice(0,2).map(v=>v._id);
    const meatIds = (meats.data || []).slice(0,1).map(m=>m._id);

    const order = {
      items: [{ pizza: { base: firstBase._id, sauce: firstSauce._id, cheese: firstCheese._id, veggies: veggieIds, meats: meatIds, quantity: 1 } }],
      deliveryAddress: { street: 'Test', city: 'City', state: 'State', zipCode: '000000' },
      contactNumber: '9000000000'
    };

    const orderRes = await fetch(baseUrl + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(order)
    });
    const orderDataText = await orderRes.text();
    try {
      console.log('Order status', orderRes.status, JSON.stringify(JSON.parse(orderDataText), null, 2));
    } catch (e) {
      console.log('Order status', orderRes.status, orderDataText);
    }
  } catch (err) {
    console.error('Test failed', err && err.stack || err);
  }
})();
