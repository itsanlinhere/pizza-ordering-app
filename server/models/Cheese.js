const mongoose = require('mongoose');

const cheeseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cheese name is required'],
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
    enum: ['mozzarella', 'cheddar', 'parmesan', 'gouda', 'feta', 'vegan', 'other'],
    default: 'mozzarella'
  },
  isVegan: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
cheeseSchema.index({ isAvailable: 1, stock: -1 });

module.exports = mongoose.model('Cheese', cheeseSchema);
