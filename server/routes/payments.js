const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const PizzaBase = require('../models/PizzaBase');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const Veggie = require('../models/Veggie');
const Meat = require('../models/Meat');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'your_secret';

// Simulation mode: enabled explicitly or when keys are left as placeholders
const SIMULATE = process.env.PAYMENT_SIMULATE === 'true' || key_id.startsWith('rzp_test_your');

// Lazily require razorpay only when running in real mode to avoid server crash when the package
// isn't installed (useful during quick local tests). If unavailable, leave undefined and
// respond with an instructive error when someone tries to use real mode.
let razorpay = null;
let RAZORPAY_AVAILABLE = false;
if (!SIMULATE) {
  try {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({ key_id, key_secret });
    RAZORPAY_AVAILABLE = true;
  } catch (e) {
    console.warn('razorpay package not available. Install it or enable PAYMENT_SIMULATE to run without Razorpay.');
    RAZORPAY_AVAILABLE = false;
  }
}

// Create a razorpay order for the given items. Protected route.
router.post('/razorpay/create-order', protect, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    // Calculate amount in smallest currency unit (paise)
    let total = 0;
    for (const it of items) {
      const base = await PizzaBase.findById(it.pizza.base);
      const sauce = await Sauce.findById(it.pizza.sauce);
      const cheese = await Cheese.findById(it.pizza.cheese);
      const veggies = it.pizza.veggies ? await Veggie.find({ _id: { $in: it.pizza.veggies } }) : [];
      const meats = it.pizza.meats ? await Meat.find({ _id: { $in: it.pizza.meats } }) : [];

      if (!base || !sauce || !cheese) {
        return res.status(400).json({ success: false, message: 'Invalid pizza selection' });
      }

      let price = base.price + sauce.price + cheese.price;
      for (const v of veggies) price += v.price;
      for (const m of meats) price += m.price;
      price = price * (it.pizza.quantity || 1);
      total += price;
    }

    const amountInPaise = Math.round(total * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1
    };

    if (SIMULATE) {
      // Development simulation: return a fake order id so the client can open checkout-like UX
      const fakeId = `sim_order_${Date.now()}`;
      return res.json({ success: true, data: { orderId: fakeId, amount: options.amount, currency: options.currency, key: key_id, simulate: true } });
    }

    if (!RAZORPAY_AVAILABLE) {
      return res.status(500).json({ success: false, message: 'Razorpay integration not available. Install the `razorpay` package or enable PAYMENT_SIMULATE mode.' });
    }

    const order = await razorpay.orders.create(options);

    return res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, key: key_id, simulate: false } });
  } catch (err) {
    console.error('Razorpay create-order error:', err && (err.message || err));
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// Verify razorpay payment and create the order in DB (protected)
router.post('/razorpay/verify', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, deliveryAddress, contactNumber, specialInstructions } = req.body;

    // verify signature
    const crypto = require('crypto');
    if (!SIMULATE) {
      const generated_signature = crypto.createHmac('sha256', key_secret).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    } else {
      // In simulate mode accept any signature but log the values for debugging
      console.log('SIMULATE payment verify', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
    }

    // Recalculate total and validate items (similar to orders route)
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

      let price = base.price + sauce.price + cheese.price;
      for (const v of veggies) price += v.price;
      for (const m of meats) price += m.price;
      price = price * (it.pizza.quantity || 1);
      total += price;
    }

    const orderDoc = await Order.create([{ customer: req.user._id, items, totalAmount: total, deliveryAddress, contactNumber, paymentMethod: 'razorpay', specialInstructions, paymentStatus: 'completed', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id }], { session });

    // decrement stock
    for (const it of items) {
      const base = await PizzaBase.findById(it.pizza.base).session(session);
      if (base) { base.stock = Math.max(0, base.stock - (it.pizza.quantity || 1)); await base.save({ session }); }
      const sauce = await Sauce.findById(it.pizza.sauce).session(session);
      if (sauce) { sauce.stock = Math.max(0, sauce.stock - (it.pizza.quantity || 1)); await sauce.save({ session }); }
      const cheese = await Cheese.findById(it.pizza.cheese).session(session);
      if (cheese) { cheese.stock = Math.max(0, cheese.stock - (it.pizza.quantity || 1)); await cheese.save({ session }); }
      if (it.pizza.veggies && it.pizza.veggies.length) { await Veggie.updateMany({ _id: { $in: it.pizza.veggies } }, { $inc: { stock: - (it.pizza.quantity || 1) } }).session(session); }
      if (it.pizza.meats && it.pizza.meats.length) { await Meat.updateMany({ _id: { $in: it.pizza.meats } }, { $inc: { stock: - (it.pizza.quantity || 1) } }).session(session); }
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: 'Payment verified and order placed', data: orderDoc[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Razorpay verify error:', err && (err.message || err));
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
});

module.exports = router;
