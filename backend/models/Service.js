const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['wash-fold', 'dry-cleaning', 'ironing', 'starch', 'express', 'bulk'],
    required: [true, 'Service category is required']
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  pricePerItem: {
    type: Number,
    default: 0,
    min: [0, 'Price per item cannot be negative']
  },
  estimatedTime: {
    type: String,
    required: [true, 'Estimated time is required'],
    enum: ['same-day', 'next-day', '2-days', '3-days', '1-week']
  },
  requirements: {
    type: String,
    trim: true,
    maxlength: [200, 'Requirements cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  serviceAreas: [{
    type: String,
    trim: true
  }],
  availableFor: {
    type: [String],
    enum: ['customer', 'service_provider'],
    default: ['customer']
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Minimum order quantity must be at least 1']
  },
  maxOrderQuantity: {
    type: Number,
    default: 100,
    min: [1, 'Maximum order quantity must be at least 1']
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [300, 'Special instructions cannot exceed 300 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  popularity: {
    type: Number,
    default: 0,
    min: [0, 'Popularity cannot be negative']
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted price
serviceSchema.virtual('formattedPrice').get(function() {
  return `$${this.basePrice.toFixed(2)}`;
});

// Virtual for estimated time in hours
serviceSchema.virtual('estimatedHours').get(function() {
  const timeMap = {
    'same-day': 4,
    'next-day': 24,
    '2-days': 48,
    '3-days': 72,
    '1-week': 168
  };
  return timeMap[this.estimatedTime] || 24;
});

// Method to update popularity
serviceSchema.methods.updatePopularity = function() {
  this.popularity = this.totalOrders * this.averageRating;
  return this.save();
};

// Ensure virtual fields are serialized
serviceSchema.set('toJSON', {
  virtuals: true
});

// Add pagination plugin
serviceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Service', serviceSchema); 