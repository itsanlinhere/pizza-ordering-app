const express = require('express');
const router = express.Router();

const PizzaBase = require('../models/PizzaBase');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const Veggie = require('../models/Veggie');
const Meat = require('../models/Meat');

// GET all pizza bases
router.get('/bases', async (req, res) => {
  try {
    const bases = await PizzaBase.find({ isAvailable: true }).limit(50);
    res.json({ success: true, data: bases });
  } catch (err) {
    console.error('Error fetching bases:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all sauces
router.get('/sauces', async (req, res) => {
  try {
    const sauces = await Sauce.find({ isAvailable: true }).limit(50);
    res.json({ success: true, data: sauces });
  } catch (err) {
    console.error('Error fetching sauces:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all cheeses
router.get('/cheeses', async (req, res) => {
  try {
    const cheeses = await Cheese.find({ isAvailable: true }).limit(50);
    res.json({ success: true, data: cheeses });
  } catch (err) {
    console.error('Error fetching cheeses:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all veggies
router.get('/veggies', async (req, res) => {
  try {
    const veggies = await Veggie.find({ isAvailable: true }).limit(100);
    res.json({ success: true, data: veggies });
  } catch (err) {
    console.error('Error fetching veggies:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET all meats
router.get('/meats', async (req, res) => {
  try {
    const meats = await Meat.find({ isAvailable: true }).limit(100);
    res.json({ success: true, data: meats });
  } catch (err) {
    console.error('Error fetching meats:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
