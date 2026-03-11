import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Delicious Pizzas Made Just For You</h1>
          <p className="hero-subtitle">
            Customize your perfect pizza with our fresh ingredients and enjoy fast delivery to your doorstep.
          </p>
          <div className="hero-buttons">
            {isAuthenticated ? (
              <>
                <Link to="/build-pizza" className="btn btn-primary">
                  Build Your Pizza
                </Link>
                <Link to="/dashboard" className="btn btn-secondary">
                  View Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="pizza-illustration">
            <span className="emoji">🍕</span>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose PizzaApp?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Custom Pizza Builder</h3>
              <p>Create your perfect pizza by choosing from our wide variety of bases, sauces, cheeses, veggies, and meats.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>Hot and fresh pizzas delivered to your doorstep within 45 minutes or get it free!</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payments</h3>
              <p>Pay securely with our integrated payment system. Cash on delivery also available.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍💼</div>
              <h3>Admin Management</h3>
              <p>Complete inventory management and order tracking system for our administrators.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <h2>Ready to Order Your Perfect Pizza?</h2>
          <p>Join thousands of satisfied customers who love our customizable pizzas.</p>
          <Link to={isAuthenticated ? "/build-pizza" : "/register"} className="btn btn-primary btn-large">
            {isAuthenticated ? "Start Building" : "Create Account"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
