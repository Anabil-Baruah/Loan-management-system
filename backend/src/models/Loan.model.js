/**
 * Ongoing Loan Model
 * 
 * Represents an active loan after disbursement.
 * Tracks EMI schedules, payments, and loan lifecycle.
 */

const mongoose = require('mongoose');

// EMI Schedule sub-schema
const emiScheduleSchema = new mongoose.Schema({
  emiNumber: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  principal: {
    type: Number,
    required: true,
  },
  interest: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'partially_paid'],
    default: 'pending',
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  paidDate: Date,
  penaltyAmount: {
    type: Number,
    default: 0,
  },
  paymentReference: String,
}, { _id: true });

// Applicant sub-schema (denormalized for performance)
const applicantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  pan: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  dateOfBirth: Date,
}, { _id: false });

const loanSchema = new mongoose.Schema({
  loanNumber: {
    type: String,
    unique: true,
    default: function() {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `LN${year}${random}`;
    },
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication',
    required: true,
  },
  applicant: {
    type: applicantSchema,
    required: true,
  },
  loanProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanProduct',
    required: true,
  },
  disbursedAmount: {
    type: Number,
    required: [true, 'Disbursed amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  outstandingAmount: {
    type: Number,
    required: true,
    min: [0, 'Outstanding amount cannot be negative'],
  },
  tenure: {
    type: Number,
    required: [true, 'Tenure is required'],
    min: [1, 'Tenure must be at least 1 month'],
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative'],
  },
  emiAmount: {
    type: Number,
    required: true,
    min: [0, 'EMI amount cannot be negative'],
  },
  nextEmiDate: {
    type: Date,
  },
  collaterals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collateral',
  }],
  totalCollateralValue: {
    type: Number,
    default: 0,
  },
  currentLTV: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'overdue', 'closed', 'defaulted', 'restructured'],
    default: 'active',
  },
  emiSchedule: [emiScheduleSchema],
  totalPrincipalPaid: {
    type: Number,
    default: 0,
  },
  totalInterestPaid: {
    type: Number,
    default: 0,
  },
  disbursedAt: {
    type: Date,
    required: true,
  },
  closedAt: Date,
  closureReason: {
    type: String,
    enum: ['fully_paid', 'foreclosure', 'defaulted', 'restructured'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for paid EMIs count
loanSchema.virtual('paidEmisCount').get(function() {
  return this.emiSchedule.filter(emi => emi.status === 'paid').length;
});

// Virtual for overdue EMIs count
loanSchema.virtual('overdueEmisCount').get(function() {
  return this.emiSchedule.filter(emi => emi.status === 'overdue').length;
});

// Update current LTV
loanSchema.methods.updateCurrentLTV = async function() {
  if (this.totalCollateralValue > 0) {
    this.currentLTV = (this.outstandingAmount / this.totalCollateralValue) * 100;
  }
  return this.save();
};

// Generate EMI schedule
loanSchema.methods.generateEmiSchedule = function() {
  const schedule = [];
  const monthlyRate = this.interestRate / 12 / 100;
  const emi = this.emiAmount;
  let balance = this.disbursedAmount;
  
  const startDate = new Date(this.disbursedAt);
  
  for (let i = 1; i <= this.tenure; i++) {
    const interest = balance * monthlyRate;
    const principal = emi - interest;
    balance -= principal;
    
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      emiNumber: i,
      dueDate,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      totalAmount: Math.round(emi * 100) / 100,
      status: 'pending',
    });
  }
  
  this.emiSchedule = schedule;
  return schedule;
};

// Indexes
loanSchema.index({ loanNumber: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ 'applicant.pan': 1 });
loanSchema.index({ nextEmiDate: 1 });
loanSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Loan', loanSchema);
