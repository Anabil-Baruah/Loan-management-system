/**
 * Loan Product Model
 * 
 * Defines the schema for loan products offered by the NBFC.
 * Each product has specific terms like interest rate, tenure, LTV limits, etc.
 */

const mongoose = require('mongoose');

const loanProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative'],
    max: [50, 'Interest rate cannot exceed 50%'],
  },
  minAmount: {
    type: Number,
    required: [true, 'Minimum amount is required'],
    min: [0, 'Minimum amount cannot be negative'],
  },
  maxAmount: {
    type: Number,
    required: [true, 'Maximum amount is required'],
    validate: {
      validator: function(value) {
        return value >= this.minAmount;
      },
      message: 'Maximum amount must be greater than or equal to minimum amount',
    },
  },
  minTenure: {
    type: Number,
    required: [true, 'Minimum tenure is required'],
    min: [1, 'Minimum tenure must be at least 1 month'],
  },
  maxTenure: {
    type: Number,
    required: [true, 'Maximum tenure is required'],
    validate: {
      validator: function(value) {
        return value >= this.minTenure;
      },
      message: 'Maximum tenure must be greater than or equal to minimum tenure',
    },
  },
  maxLTV: {
    type: Number,
    required: [true, 'Maximum LTV is required'],
    min: [0, 'LTV cannot be negative'],
    max: [100, 'LTV cannot exceed 100%'],
  },
  processingFee: {
    type: Number,
    required: [true, 'Processing fee is required'],
    min: [0, 'Processing fee cannot be negative'],
    max: [10, 'Processing fee cannot exceed 10%'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for efficient queries
loanProductSchema.index({ status: 1 });
loanProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('LoanProduct', loanProductSchema);
