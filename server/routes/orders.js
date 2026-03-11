const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Order = require('../models/Order');
const PizzaBase = require('../models/PizzaBase');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const Veggie = require('../models/Veggie');
const Meat = require('../models/Meat');
const { sendLowStockAlert } = require('../utils/email');
const { protect } = require('../middleware/auth');

// Create an order (protected)
router.post('/', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, deliveryAddress, contactNumber, paymentMethod, specialInstructions } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    // Calculate total and validate items
    let total = 0;
    for (const it of items) {
      const base = await PizzaBase.findById(it.pizza.base).session(session);
      const sauce = await Sauce.findById(it.pizza.sauce).session(session);
      const cheese = await Cheese.findById(it.pizza.cheese).session(session);
      const veggies = it.pizza.veggies ? await Veggie.find({ _id: { $in: it.pizza.veggies } }).session(session) : [];
      const meats = it.pizza.meats ? await Meat.find({ _id: { $in: it.pizza.meats } }).session(session) : [];

      if (!base || !sauce || !cheese) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'Invalid pizza selection' });
      }

      // Basic price calc
      let price = base.price + sauce.price + cheese.price;
      for (const v of veggies) price += v.price;
      for (const m of meats) price += m.price;
      price = price * (it.pizza.quantity || 1);
      total += price;
    }

    // Create order
    const order = await Order.create([{
      customer: req.user._id,
      items,
      totalAmount: total,
      deliveryAddress,
      contactNumber,
      paymentMethod: paymentMethod || 'razorpay',
      specialInstructions
    }], { session });

    // Decrement stock for each selected item
    for (const it of items) {
      const base = await PizzaBase.findById(it.pizza.base).session(session);
      if (base) {
        base.stock = Math.max(0, base.stock - (it.pizza.quantity || 1));
        await base.save({ session });
      }
      const sauce = await Sauce.findById(it.pizza.sauce).session(session);
      if (sauce) {
        sauce.stock = Math.max(0, sauce.stock - (it.pizza.quantity || 1));
        await sauce.save({ session });
      }
      const cheese = await Cheese.findById(it.pizza.cheese).session(session);
      if (cheese) {
        cheese.stock = Math.max(0, cheese.stock - (it.pizza.quantity || 1));
        await cheese.save({ session });
      }
      if (it.pizza.veggies && it.pizza.veggies.length) {
        await Veggie.updateMany({ _id: { $in: it.pizza.veggies } }, { $inc: { stock: - (it.pizza.quantity || 1) } }).session(session);
      }
      if (it.pizza.meats && it.pizza.meats.length) {
        await Meat.updateMany({ _id: { $in: it.pizza.meats } }, { $inc: { stock: - (it.pizza.quantity || 1) } }).session(session);
      }
    }

    // After decrementing stock, check thresholds and alert admin if any item fell below threshold
    try {
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
      if (ADMIN_EMAIL) {
        // Check bases, sauces, cheeses, veggies, meats
        const checks = [];
        const allBases = await PizzaBase.find({}).session(session);
        const allSauces = await Sauce.find({}).session(session);
        const allCheeses = await Cheese.find({}).session(session);
        const allVeggies = await Veggie.find({}).session(session);
        const allMeats = await Meat.find({}).session(session);

        [...allBases, ...allSauces, ...allCheeses, ...allVeggies, ...allMeats].forEach(item => {
          if (typeof item.stock === 'number' && typeof item.threshold === 'number' && item.stock <= item.threshold) {
            checks.push({ name: item.name, stock: item.stock, threshold: item.threshold });
          }
        });

        for (const c of checks) {
          // Send email (in dev this will log to console)
          try {
            await sendLowStockAlert(ADMIN_EMAIL, c.name, c.stock, c.threshold);
          } catch (e) {
            console.error('Failed to send low stock alert for', c.name, e && e.message);
          }
        }
      }
    } catch (err) {
      console.error('Error checking stock thresholds:', err);
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, message: 'Order placed successfully', data: order[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET orders for current user
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
