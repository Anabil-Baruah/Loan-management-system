/**
 * Mutual Fund Collateral Model
 * 
 * Represents mutual fund units that can be pledged as collateral.
 * Tracks NAV, units, lien status, and other fund details.
 */

const mongoose = require('mongoose');

const collateralSchema = new mongoose.Schema({
  fundName: {
    type: String,
    required: [true, 'Fund name is required'],
    trim: true,
  },
  folioNumber: {
    type: String,
    required: [true, 'Folio number is required'],
    unique: true,
    trim: true,
  },
  units: {
    type: Number,
    required: [true, 'Number of units is required'],
    min: [0, 'Units cannot be negative'],
  },
  navPerUnit: {
    type: Number,
    required: [true, 'NAV per unit is required'],
    min: [0, 'NAV cannot be negative'],
  },
  currentValue: {
    type: Number,
    default: function() {
      return this.units * this.navPerUnit;
    },
  },
  amcName: {
    type: String,
    required: [true, 'AMC name is required'],
    trim: true,
  },
  schemeType: {
    type: String,
    enum: ['equity', 'debt', 'hybrid', 'liquid'],
    required: [true, 'Scheme type is required'],
  },
  lienStatus: {
    type: String,
    enum: ['none', 'marked', 'released'],
    default: 'none',
  },
  lienMarkedDate: {
    type: Date,
  },
  lienReleasedDate: {
    type: Date,
  },
  isin: {
    type: String,
    required: [true, 'ISIN is required'],
    trim: true,
    match: [/^INF[A-Z0-9]{9}$/, 'Invalid ISIN format'],
  },
  investorName: {
    type: String,
    trim: true,
  },
  investorPan: {
    type: String,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
  },
  linkedApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication',
  },
  linkedLoan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
  },
  navLastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Pre-save middleware to calculate currentValue
collateralSchema.pre('save', function(next) {
  this.currentValue = this.units * this.navPerUnit;
  next();
});

// Indexes
collateralSchema.index({ folioNumber: 1 });
collateralSchema.index({ lienStatus: 1 });
collateralSchema.index({ schemeType: 1 });
collateralSchema.index({ investorPan: 1 });

module.exports = mongoose.model('Collateral', collateralSchema);
