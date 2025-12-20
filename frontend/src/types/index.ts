/**
 * LMS Type Definitions
 * Central type definitions for the Loan Management System
 */

// Loan Product Types
export interface LoanProduct {
  _id: string;
  name: string;
  description: string;
  interestRate: number; // Annual interest rate in percentage
  minAmount: number;
  maxAmount: number;
  minTenure: number; // In months
  maxTenure: number;
  maxLTV: number; // Loan to Value ratio (percentage)
  processingFee: number; // Percentage of loan amount
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Applicant Types
export interface Applicant {
  name: string;
  email: string;
  phone: string;
  pan: string;
  address: string;
  dateOfBirth: string;
}

// Mutual Fund Collateral Types
export interface MutualFundUnit {
  _id: string;
  fundName: string;
  folioNumber: string;
  units: number;
  navPerUnit: number;
  currentValue: number;
  amcName: string;
  schemeType: 'equity' | 'debt' | 'hybrid' | 'liquid';
  lienStatus: 'none' | 'marked' | 'released';
  lienMarkedDate?: string;
  isin: string;
}

// Loan Application Types
export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'closed';

export interface LoanApplication {
  _id: string;
  applicationNumber: string;
  applicant: Applicant;
  loanProduct: LoanProduct | string;
  requestedAmount: number;
  approvedAmount?: number;
  tenure: number; // In months
  interestRate: number;
  collaterals: MutualFundUnit[];
  totalCollateralValue: number;
  ltv: number; // Calculated LTV
  status: ApplicationStatus;
  remarks?: string;
  submittedAt?: string;
  approvedAt?: string;
  disbursedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Ongoing Loan Types
export type LoanStatus = 'active' | 'overdue' | 'closed' | 'defaulted';

export interface EMISchedule {
  emiNumber: number;
  dueDate: string;
  principal: number;
  interest: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
}

export interface OngoingLoan {
  _id: string;
  loanNumber: string;
  application: LoanApplication | string;
  applicant: Applicant;
  disbursedAmount: number;
  outstandingAmount: number;
  tenure: number;
  interestRate: number;
  emiAmount: number;
  nextEmiDate: string;
  collaterals: MutualFundUnit[];
  currentLTV: number;
  status: LoanStatus;
  emiSchedule: EMISchedule[];
  disbursedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Statistics
export interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  totalDisbursed: number;
  totalOutstanding: number;
  activeLoans: number;
  overdueLoans: number;
  totalCollateralValue: number;
  averageLTV: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface CreateLoanApplicationForm {
  applicant: Applicant;
  loanProductId: string;
  requestedAmount: number;
  tenure: number;
  collateralFolios: string[];
}
