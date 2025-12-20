/**
 * Loan Application Model
 * 
 * Represents a loan application submitted by an applicant.
 * Goes through various stages: draft -> submitted -> under_review -> approved/rejected -> disbursed
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Applicant sub-schema
const applicantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Applicant name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  pan: {
    type: String,
    required: [true, 'PAN is required'],
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
  },
  address: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
}, { _id: false });

const loanApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    unique: true,
    default: function() {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `LAMF${year}${random}`;
    },
  },
  applicant: {
    type: applicantSchema,
    required: true,
  },
  loanProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanProduct',
    required: [true, 'Loan product is required'],
  },
  requestedAmount: {
    type: Number,
    required: [true, 'Requested amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  approvedAmount: {
    type: Number,
    min: [0, 'Approved amount cannot be negative'],
  },
  tenure: {
    type: Number,
    required: [true, 'Tenure is required'],
    min: [1, 'Tenure must be at least 1 month'],
  },
  interestRate: {
    type: Number,
    min: [0, 'Interest rate cannot be negative'],
  },
  collaterals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collateral',
  }],
  totalCollateralValue: {
    type: Number,
    default: 0,
  },
  ltv: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'closed'],
    default: 'draft',
  },
  remarks: {
    type: String,
    trim: true,
  },
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  disbursedAt: Date,
  closedAt: Date,
  reviewedBy: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Calculate LTV before saving
loanApplicationSchema.pre('save', async function(next) {
  if (this.totalCollateralValue > 0) {
    this.ltv = (this.requestedAmount / this.totalCollateralValue) * 100;
  }
  next();
});

// Indexes
loanApplicationSchema.index({ applicationNumber: 1 });
loanApplicationSchema.index({ status: 1 });
loanApplicationSchema.index({ 'applicant.pan': 1 });
loanApplicationSchema.index({ 'applicant.email': 1 });
loanApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);
