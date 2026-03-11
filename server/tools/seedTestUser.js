const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pizza-app');
  console.log('Connected to MongoDB for seeding test user');

  const email = 'test@demo.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Test user already exists:', email);
    mongoose.disconnect();
    return;
  }

  const user = new User({
    name: 'Test User',
    email,
    password: 'password123',
    phone: '9000000000',
    isVerified: true,
    role: 'user'
  });

  await user.save();
  console.log('Test user created:', email, 'password: password123');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding test user error:', err);
  mongoose.disconnect();
});
