const mongoose = require('mongoose');
require('dotenv').config();

const PizzaBase = require('../models/PizzaBase');
const Sauce = require('../models/Sauce');
const Cheese = require('../models/Cheese');
const Veggie = require('../models/Veggie');
const Meat = require('../models/Meat');

const data = {
  bases: [
    { name: 'Classic Thin', price: 100, stock: 50, category: 'thin' },
    { name: 'Classic Thick', price: 120, stock: 50, category: 'thick' },
    { name: 'Stuffed Crust', price: 150, stock: 30, category: 'stuffed' },
    { name: 'Gluten Free', price: 180, stock: 20, category: 'gluten-free' },
    { name: 'Cheesy Burst', price: 160, stock: 25, category: 'stuffed' }
  ],
  sauces: [
    { name: 'Tomato Basil', price: 20, stock: 100, category: 'tomato' },
    { name: 'BBQ', price: 30, stock: 80, category: 'bbq' },
    { name: 'Pesto', price: 35, stock: 60, category: 'pesto' },
    { name: 'White Garlic', price: 25, stock: 70, category: 'white' },
    { name: 'Spicy Arrabbiata', price: 25, stock: 70, category: 'tomato' }
  ],
  cheeses: [
    { name: 'Mozzarella', price: 40, stock: 100, type: 'mozzarella' },
    { name: 'Cheddar', price: 45, stock: 80, type: 'cheddar' },
    { name: 'Parmesan', price: 50, stock: 60, type: 'parmesan' },
    { name: 'Gouda', price: 55, stock: 50, type: 'gouda' },
    { name: 'Vegan Cheese', price: 60, stock: 40, type: 'vegan', isVegan: true }
  ],
  veggies: [
    { name: 'Onion', price: 10, stock: 200 },
    { name: 'Bell Pepper', price: 12, stock: 180 },
    { name: 'Mushroom', price: 15, stock: 160 },
    { name: 'Tomato', price: 8, stock: 220 },
    { name: 'Olives', price: 12, stock: 150 }
  ],
  meats: [
    { name: 'Chicken', price: 60, stock: 120, type: 'chicken' },
    { name: 'Pepperoni', price: 70, stock: 100, type: 'pork' },
    { name: 'Bacon', price: 75, stock: 80, type: 'pork' },
    { name: 'Beef', price: 80, stock: 90, type: 'beef' },
    { name: 'Ham', price: 65, stock: 60, type: 'pork' }
  ]
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pizza-app');
  console.log('Connected to MongoDB for seeding');

  await PizzaBase.deleteMany({});
  await Sauce.deleteMany({});
  await Cheese.deleteMany({});
  await Veggie.deleteMany({});
  await Meat.deleteMany({});

  await PizzaBase.insertMany(data.bases);
  await Sauce.insertMany(data.sauces);
  await Cheese.insertMany(data.cheeses);
  await Veggie.insertMany(data.veggies);
  await Meat.insertMany(data.meats);

  console.log('Seeding complete');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  mongoose.disconnect();
});
