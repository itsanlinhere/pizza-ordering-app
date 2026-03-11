const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pizza-app');
  console.log('Connected to MongoDB for seeding admin user');

  const email = 'admin@demo.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin user already exists:', email);
    mongoose.disconnect();
    return;
  }

  const user = new User({
    name: 'Admin User',
    email,
    password: 'admin123',
    phone: '9000000002',
    isVerified: true,
    role: 'admin'
  });

  await user.save();
  console.log('Admin user created:', email, 'password: admin123');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding admin user error:', err);
  mongoose.disconnect();
});
