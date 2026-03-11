import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // TODO: Fetch user's recent orders from API
    // For now, using mock data
    setTimeout(() => {
      setRecentOrders([
        {
          id: 'ORD123456',
          status: 'delivered',
          totalAmount: 450,
          createdAt: new Date().toISOString(),
          items: [{ name: 'Custom Pizza', quantity: 1 }]
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="not-authenticated">
            <h2>Please log in to view your dashboard</h2>
            <Link to="/login" className="btn btn-primary">Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.name}!</h1>
          <p>Manage your orders and build your next pizza</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/build-pizza" className="action-card">
                <div className="action-icon">🍕</div>
                <h3>Build Pizza</h3>
                <p>Create your custom pizza</p>
              </Link>
              <Link to="/orders" className="action-card">
                <div className="action-icon">📋</div>
                <h3>Order History</h3>
                <p>View your past orders</p>
              </Link>
              <Link to="/profile" className="action-card">
                <div className="action-icon">👤</div>
                <h3>Profile</h3>
                <p>Manage your account</p>
              </Link>
            </div>
          </div>

          <div className="dashboard-card recent-orders">
            <h2>Recent Orders</h2>
            {loading ? (
              <div className="loading">Loading orders...</div>
            ) : recentOrders.length > 0 ? (
              <div className="orders-list">
                {recentOrders.map((order) => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <h4>Order #{order.id}</h4>
                      <p>{order.items.length} item(s) • ₹{order.totalAmount}</p>
                      <span className={`status status-${order.status}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                <Link to="/orders" className="view-all">View All Orders →</Link>
              </div>
            ) : (
              <div className="no-orders">
                <p>No orders yet</p>
                <Link to="/build-pizza" className="btn btn-primary">Order Your First Pizza</Link>
              </div>
            )}
          </div>

          <div className="dashboard-card stats">
            <h2>Your Stats</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">Total Orders</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">₹0</div>
                <div className="stat-label">Total Spent</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">0</div>
                <div className="stat-label">Favorite Toppings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
