const mongoose = require('mongoose');

const sauceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sauce name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 100,
    min: [0, 'Stock cannot be negative']
  },
  threshold: {
    type: Number,
    default: 20,
    min: [0, 'Threshold cannot be negative']
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'extra-hot'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['tomato', 'pesto', 'white', 'bbq', 'other'],
    default: 'tomato'
  }
}, {
  timestamps: true
});

// Index for faster queries
sauceSchema.index({ isAvailable: 1, stock: -1 });

module.exports = mongoose.model('Sauce', sauceSchema);
