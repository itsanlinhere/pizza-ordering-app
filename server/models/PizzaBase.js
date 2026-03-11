const mongoose = require('mongoose');

const pizzaBaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Base name is required'],
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
    enum: ['thin', 'thick', 'stuffed', 'gluten-free'],
    default: 'regular'
  }
}, {
  timestamps: true
});

// Index for faster queries
pizzaBaseSchema.index({ isAvailable: 1, stock: -1 });

module.exports = mongoose.model('PizzaBase', pizzaBaseSchema);
