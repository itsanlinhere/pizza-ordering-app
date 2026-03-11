const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function run(email) {
  if (!email) {
    console.error('Usage: node tools/printUserVerification.js <email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pizza-app');
  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.log('User not found:', email);
    mongoose.disconnect();
    return;
  }

  console.log('User:', user.email);
  console.log('isVerified:', user.isVerified);
  console.log('emailVerificationToken (stored hash):', user.emailVerificationToken || '(none)');
  console.log('emailVerificationExpires:', user.emailVerificationExpires || '(none)');
  console.log('passwordResetToken (stored hash):', user.passwordResetToken || '(none)');
  console.log('passwordResetExpires:', user.passwordResetExpires || '(none)');

  mongoose.disconnect();
}

const emailArg = process.argv[2];
run(emailArg).catch(err => { console.error(err); mongoose.disconnect(); });
