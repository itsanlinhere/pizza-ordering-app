const mongoose = require('mongoose');

const veggieSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veggie name is required'],
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
  category: {
    type: String,
    enum: ['leafy', 'cruciferous', 'root', 'fruit', 'mushroom', 'pepper', 'onion', 'other'],
    default: 'other'
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  nutritionalInfo: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for faster queries
veggieSchema.index({ isAvailable: 1, stock: -1 });

module.exports = mongoose.model('Veggie', veggieSchema);
