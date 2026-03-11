const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    pizza: {
      base: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PizzaBase',
        required: true
      },
      sauce: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sauce',
        required: true
      },
      cheese: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cheese',
        required: true
      },
      veggies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Veggie'
      }],
      meats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meat'
      }],
      quantity: {
        type: Number,
        default: 1,
        min: [1, 'Quantity must be at least 1']
      },
      size: {
        type: String,
        enum: ['small', 'medium', 'large', 'extra-large'],
        default: 'medium'
      }
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    customizations: {
      extraCheese: { type: Boolean, default: false },
      doubleSauce: { type: Boolean, default: false },
      thinCrust: { type: Boolean, default: false }
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  contactNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(phone) {
        return /^\d{10}$/.test(phone);
      },
      message: 'Please enter a valid 10-digit phone number'
    }
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    default: 'razorpay'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['order_received', 'in_kitchen', 'sent_to_delivery', 'delivered', 'cancelled'],
    default: 'order_received'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  estimatedDeliveryTime: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 45 * 60 * 1000); // 45 minutes from now
    }
  },
  specialInstructions: {
    type: String,
    maxlength: [200, 'Special instructions cannot exceed 200 characters']
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['order_received', 'in_kitchen', 'sent_to_delivery', 'delivered', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Generate unique order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

// Index for faster queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
