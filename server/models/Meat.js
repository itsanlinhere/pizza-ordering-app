const mongoose = require('mongoose');

const meatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Meat name is required'],
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
  type: {
    type: String,
    enum: ['chicken', 'beef', 'pork', 'turkey', 'fish', 'seafood', 'vegetarian', 'vegan'],
    default: 'chicken'
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  nutritionalInfo: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for faster queries
meatSchema.index({ isAvailable: 1, stock: -1 });

module.exports = mongoose.model('Meat', meatSchema);
