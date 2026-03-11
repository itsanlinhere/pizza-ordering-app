import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './OrderHistory.css';

// Small local date formatter to avoid an external dependency (date-fns)
const formatDate = (d) => {
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch (e) {
    return d;
  }
};

const statusLabel = (order) => {
  const map = {
    order_received: 'Received',
    in_kitchen: 'In Kitchen',
    sent_to_delivery: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return map[order] || order;
};

const OrderCard = ({ order }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="order-card">
      <div className="oc-top">
        <div>
          <div className="order-num">{order.orderNumber || order._id?.slice(-6)}</div>
          <div className="muted">{formatDate(order.createdAt)}</div>
        </div>
        <div className="right">
          <div className={`badge ${order.paymentStatus === 'completed' ? 'paid' : 'pending'}`}>{order.paymentStatus}</div>
          <div className={`badge status ${order.orderStatus}`}>{statusLabel(order.orderStatus)}</div>
        </div>
      </div>

      <div className="oc-body">
        <div className="items">
          {order.items.slice(0, 3).map((it, idx) => (
            <div key={idx} className="item-line">
              <div className="item-name">{it.pizza?.base?.name || 'Pizza'}</div>
              <div className="item-qty">x{it.pizza?.quantity || 1}</div>
              <div className="item-price">₹{it.price}</div>
            </div>
          ))}
          {order.items.length > 3 && <div className="muted">+{order.items.length - 3} more items</div>}
        </div>
        <div className="totals">
          <div className="muted">Total</div>
          <div className="total-amt">₹{order.totalAmount}</div>
        </div>
      </div>

      <div className="oc-actions">
        <button className="btn ghost" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Details'}</button>
      </div>

      {open && (
        <div className="oc-details">
          <h4>Items</h4>
          {order.items.map((it, idx) => (
            <div className="detail-item" key={idx}>
              <div>{it.pizza?.base?.name || 'Pizza'} ({it.pizza?.quantity || 1})</div>
              <div>₹{it.price}</div>
            </div>
          ))}
          <h4>Delivery</h4>
          <div className="detail-item">{order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.zipCode}</div>
          <div className="muted">Contact: {order.contactNumber}</div>
        </div>
      )}
    </div>
  );
};

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/orders');
        if (!mounted) return;
        setOrders(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch orders', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="page order-history"><div className="loader">Loading orders…</div></div>;
  if (error) return <div className="page order-history"><div className="error">{error}</div></div>;

  return (
    <div className="page order-history">
      <h1>Your Orders</h1>
      {orders.length === 0 && <div className="muted">No orders yet. Build your first pizza!</div>}
      <div className="orders-grid">
        {orders.map(o => <OrderCard key={o._id} order={o} />)}
      </div>
    </div>
  );
};

export default OrderHistory;
