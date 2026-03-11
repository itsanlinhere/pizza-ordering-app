const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const PizzaBase = require('../models/PizzaBase');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const Veggie = require('../models/Veggie');
const Meat = require('../models/Meat');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// GET /api/admin/inventory - list all inventory items grouped by type
router.get('/inventory', async (req, res) => {
  try {
    const [bases, sauces, cheeses, veggies, meats] = await Promise.all([
      PizzaBase.find({}).limit(200),
      Sauce.find({}).limit(200),
      Cheese.find({}).limit(200),
      Veggie.find({}).limit(200),
      Meat.find({}).limit(200)
    ]);

    res.json({ success: true, data: { bases, sauces, cheeses, veggies, meats } });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/inventory/:type/:id - update stock (type = bases|sauces|cheeses|veggies|meats)
router.put('/inventory/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { stock, threshold, isAvailable } = req.body;

    const map = {
      bases: PizzaBase,
      sauces: Sauce,
      cheeses: Cheese,
      veggies: Veggie,
      meats: Meat
    };

    const Model = map[type];
    if (!Model) return res.status(400).json({ success: false, message: 'Invalid inventory type' });

    const item = await Model.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (typeof stock !== 'undefined') item.stock = stock;
    if (typeof threshold !== 'undefined') item.threshold = threshold;
    if (typeof isAvailable !== 'undefined') item.isAvailable = isAvailable;

    await item.save();

    res.json({ success: true, message: 'Inventory updated', data: item });
  } catch (err) {
    console.error('Error updating inventory:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/orders - list recent orders (all)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(200).populate('customer', 'name email');
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/orders/:orderId/status - update order status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowed = ['order_received', 'in_kitchen', 'sent_to_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = status;
    order.statusHistory.push({ status, updatedBy: req.user._id });
    await order.save();

    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
