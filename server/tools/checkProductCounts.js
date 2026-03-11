const mongoose = require('mongoose');
require('dotenv').config();

const PizzaBase = require('../models/PizzaBase');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const Veggie = require('../models/Veggie');
const Meat = require('../models/Meat');
const Order = require('../models/Order');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pizza-app');
  console.log('Connected to MongoDB for checking counts');

  const bases = await PizzaBase.countDocuments();
  const sauces = await Sauce.countDocuments();
  const cheeses = await Cheese.countDocuments();
  const veggies = await Veggie.countDocuments();
  const meats = await Meat.countDocuments();
  const orders = await Order.countDocuments();

  console.log('Counts:');
  console.log('PizzaBase:', bases);
  console.log('Sauce:', sauces);
  console.log('Cheese:', cheeses);
  console.log('Veggie:', veggies);
  console.log('Meat:', meats);
  console.log('Order:', orders);

  mongoose.disconnect();
}

run().catch(err => { console.error(err); mongoose.disconnect(); });
