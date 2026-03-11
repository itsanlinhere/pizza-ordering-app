import React, { useEffect, useState } from 'react';
import './PizzaBuilder.css';
import axios from 'axios';

const PizzaBuilder = () => {
  const [bases, setBases] = useState([]);
  const [sauces, setSauces] = useState([]);
  const [cheeses, setCheeses] = useState([]);
  const [veggies, setVeggies] = useState([]);
  const [meats, setMeats] = useState([]);
  const [selection, setSelection] = useState({
    base: null,
    sauce: null,
    cheese: null,
    veggies: [],
    meats: [],
    quantity: 1
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [bRes, sRes, cRes, vRes, mRes] = await Promise.all([
          axios.get('/pizza/bases'),
          axios.get('/pizza/sauces'),
          axios.get('/pizza/cheeses'),
          axios.get('/pizza/veggies'),
          axios.get('/pizza/meats')
        ]);
        setBases(bRes.data.data);
        setSauces(sRes.data.data);
        setCheeses(cRes.data.data);
        setVeggies(vRes.data.data);
        setMeats(mRes.data.data);
      } catch (err) {
        console.error('Failed to load options', err);
      }
    };
    fetchOptions();
  }, []);

  const toggleMulti = (key, id) => {
    const MAX_MULTI = 5; // allow up to 5 selections for veggies/meats
    setSelection(prev => {
      const arr = new Set(prev[key]);
      if (arr.has(id)) {
        arr.delete(id);
      } else {
        if (arr.size >= MAX_MULTI) {
          // simple UX feedback; keep it small and local
          alert(`You can select up to ${MAX_MULTI} items for this section.`);
          return prev;
        }
        arr.add(id);
      }
      return { ...prev, [key]: Array.from(arr) };
    });
  };

  const getById = (list, id) => list.find(i => String(i._id) === String(id)) || null;

  // compute price breakdown
  const baseObj = getById(bases, selection.base);
  const sauceObj = getById(sauces, selection.sauce);
  const cheeseObj = getById(cheeses, selection.cheese);
  const selVegIds = (selection.veggies || []).map(String);
  const selMeatIds = (selection.meats || []).map(String);
  const selectedVeggies = veggies.filter(v => selVegIds.includes(String(v._id)));
  const selectedMeats = meats.filter(m => selMeatIds.includes(String(m._id)));

  const subtotal =
    (baseObj?.price || 0) +
    (sauceObj?.price || 0) +
    (cheeseObj?.price || 0) +
    selectedVeggies.reduce((s, v) => s + (v.price || 0), 0) +
    selectedMeats.reduce((s, m) => s + (m.price || 0), 0);

  const total = subtotal * (selection.quantity || 1);

  const placeOrder = async () => {
    try {
      // basic client-side validation
      if (!selection.base || !selection.sauce || !selection.cheese) {
        alert('Please choose a base, a sauce and a cheese to build your pizza.');
        return;
      }
      const order = {
        items: [
          {
            pizza: {
              base: selection.base,
              sauce: selection.sauce,
              cheese: selection.cheese,
              veggies: selection.veggies,
              meats: selection.meats,
              quantity: selection.quantity
            }
          }
        ],
        deliveryAddress: {
          street: 'Test Street', city: 'City', state: 'State', zipCode: '000000'
        },
        contactNumber: '9000000000'
      };

      // 1) Create a razorpay order on the server
      const createRes = await axios.post('/payments/razorpay/create-order', { items: order.items });
      if (!createRes.data.success) {
        alert('Failed to create payment order: ' + (createRes.data.message || ''));
        return;
      }

      const { orderId, amount, currency, key, simulate } = createRes.data.data;

      // If server is running in simulate mode, skip loading Razorpay and call verify directly
      if (simulate) {
        try {
          const fakePaymentId = `sim_payment_${Date.now()}`;
          const fakeSignature = `sim_signature_${Date.now()}`;
          const verifyRes = await axios.post('/payments/razorpay/verify', {
            razorpay_order_id: orderId,
            razorpay_payment_id: fakePaymentId,
            razorpay_signature: fakeSignature,
            items: order.items,
            deliveryAddress: order.deliveryAddress,
            contactNumber: order.contactNumber
          });
          if (verifyRes.data.success) {
            alert('Simulated payment: order placed: ' + (verifyRes.data.data.orderNumber || verifyRes.data.data._id));
          } else {
            alert('Simulated payment failed: ' + (verifyRes.data.message || ''));
          }
        } catch (e) {
          console.error('Simulate verify failed', e);
          alert('Simulated payment failed. Check server logs.');
        }
        return;
      }

      // 2) Load Razorpay script
      const loadRazorpay = () => new Promise((resolve) => {
        if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      const ok = await loadRazorpay();
      if (!ok) {
        alert('Failed to load payment gateway. Try again later.');
        return;
      }

      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Pizza App',
        description: 'Order Payment',
        order_id: orderId,
        handler: async function (resp) {
          try {
            // verify payment on server and create the order
            const verifyRes = await axios.post('/payments/razorpay/verify', {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              items: order.items,
              deliveryAddress: order.deliveryAddress,
              contactNumber: order.contactNumber
            });

            if (verifyRes.data.success) {
              alert('Payment successful and order placed: ' + (verifyRes.data.data.orderNumber || verifyRes.data.data._id));
            } else {
              alert('Payment succeeded but order placement failed: ' + (verifyRes.data.message || ''));
            }
          } catch (e) {
            console.error('Verify call failed', e);
            alert('Payment succeeded but verification failed on server. Check logs.');
          }
        },
        prefill: {
          name: '',
          email: ''
        },
        theme: { color: '#ff6b35' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Order failed', err.response || err.message);
      alert('Order failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="page pizza-builder">
      <h1>Build Your Pizza</h1>

      <section>
        <h2>Choose a base</h2>
        <div className="options">
          {bases.map(b => (
            <button
              key={b._id}
              onClick={() => setSelection(prev => ({ ...prev, base: b._id }))}
              className={`option-btn ${String(selection.base) === String(b._id) ? 'selected' : ''}`}>
              <div className="option-title">{b.name}</div>
              <div className="option-price">₹{b.price}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Choose a sauce</h2>
        <div className="options">
          {sauces.map(s => (
            <button
              key={s._id}
              onClick={() => setSelection(prev => ({ ...prev, sauce: s._id }))}
              className={`option-btn ${String(selection.sauce) === String(s._id) ? 'selected' : ''}`}>
              <div className="option-title">{s.name}</div>
              <div className="option-price">₹{s.price}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Choose a cheese</h2>
        <div className="options">
          {cheeses.map(c => (
            <button
              key={c._id}
              onClick={() => setSelection(prev => ({ ...prev, cheese: c._id }))}
              className={`option-btn ${String(selection.cheese) === String(c._id) ? 'selected' : ''}`}>
              <div className="option-title">{c.name}</div>
              <div className="option-price">₹{c.price}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Veggies (optional)</h2>
        <div className="options">
          {veggies.map(v => (
            <button
              key={v._id}
              onClick={() => toggleMulti('veggies', v._id)}
              className={`option-btn ${selVegIds.includes(String(v._id)) ? 'selected' : ''}`}>
              <div className="option-title">{v.name}</div>
              <div className="option-price">₹{v.price}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Meats (optional)</h2>
        <div className="options">
          {meats.map(m => (
            <button
              key={m._id}
              onClick={() => toggleMulti('meats', m._id)}
              className={`option-btn ${selMeatIds.includes(String(m._id)) ? 'selected' : ''}`}>
              <div className="option-title">{m.name}</div>
              <div className="option-price">₹{m.price}</div>
            </button>
          ))}
        </div>
      </section>

      <div style={{ marginTop: 20 }}>
        <label>Quantity: </label>
        <input type="number" value={selection.quantity} min={1} onChange={e => setSelection(prev => ({ ...prev, quantity: Number(e.target.value) }))} />
      </div>

      <section style={{ marginTop: 20 }}>
        <h2>Summary</h2>
        <div className="summary">
          <div className="line"><div>Base</div><div>{baseObj ? `${baseObj.name} (₹${baseObj.price})` : '—'}</div></div>
          <div className="line"><div>Sauce</div><div>{sauceObj ? `${sauceObj.name} (₹${sauceObj.price})` : '—'}</div></div>
          <div className="line"><div>Cheese</div><div>{cheeseObj ? `${cheeseObj.name} (₹${cheeseObj.price})` : '—'}</div></div>
          <div className="line"><div>Veggies</div><div>{selectedVeggies.length > 0 ? selectedVeggies.map(v => `${v.name} (₹${v.price})`).join(', ') : '—'}</div></div>
          <div className="line"><div>Meats</div><div>{selectedMeats.length > 0 ? selectedMeats.map(m => `${m.name} (₹${m.price})`).join(', ') : '—'}</div></div>
          <div className="line"><div>Quantity</div><div>{selection.quantity}</div></div>
          <div className="line total"><div>Subtotal</div><div>₹{subtotal}</div></div>
          <div className="line total"><div>Total</div><div>₹{total}</div></div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={placeOrder} className="btn btn-primary">Place Order</button>
        </div>
      </section>
    </div>
  );
};

export default PizzaBuilder;
