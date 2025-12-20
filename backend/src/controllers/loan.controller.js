/**
 * Ongoing Loan Controller
 * 
 * Handles operations for active loans including
 * payment recording, EMI management, and loan closure.
 */

const Loan = require('../models/Loan.model');
const Collateral = require('../models/Collateral.model');

/**
 * @desc    Get all ongoing loans
 * @route   GET /api/loans
 * @access  Public
 */
exports.getAllLoans = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { loanNumber: { $regex: search, $options: 'i' } },
        { 'applicant.name': { $regex: search, $options: 'i' } },
        { 'applicant.pan': { $regex: search, $options: 'i' } },
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [loans, total] = await Promise.all([
      Loan.find(query)
        .populate('loanProduct', 'name interestRate')
        .populate('collaterals', 'fundName folioNumber currentValue')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Loan.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      data: loans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single loan
 * @route   GET /api/loans/:id
 * @access  Public
 */
exports.getLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('loanProduct')
      .populate('collaterals')
      .populate('application');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found',
      });
    }
    
    res.json({
      success: true,
      data: loan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get EMI schedule for a loan
 * @route   GET /api/loans/:id/emi-schedule
 * @access  Public
 */
exports.getEmiSchedule = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id).select('emiSchedule loanNumber');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        loanNumber: loan.loanNumber,
        emiSchedule: loan.emiSchedule,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record EMI payment
 * @route   POST /api/loans/:id/payment
 * @access  Private
 */
exports.recordPayment = async (req, res, next) => {
  try {
    const { emiNumber, amount, paymentReference, paymentDate } = req.body;
    
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found',
      });
    }
    
    if (loan.status === 'closed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot record payment for closed loan',
      });
    }
    
    // Find the EMI to update
    const emiIndex = loan.emiSchedule.findIndex(e => e.emiNumber === emiNumber);
    
    if (emiIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'EMI not found',
      });
    }
    
    const emi = loan.emiSchedule[emiIndex];
    
    if (emi.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'EMI already paid',
      });
    }
    
    // Update EMI
    loan.emiSchedule[emiIndex].status = 'paid';
    loan.emiSchedule[emiIndex].paidAmount = amount;
    loan.emiSchedule[emiIndex].paidDate = paymentDate || new Date();
    loan.emiSchedule[emiIndex].paymentReference = paymentReference;
    
    // Update loan totals
    loan.totalPrincipalPaid += emi.principal;
    loan.totalInterestPaid += emi.interest;
    loan.outstandingAmount -= emi.principal;
    
    // Update next EMI date
    const nextPendingEmi = loan.emiSchedule.find(e => e.status === 'pending');
    loan.nextEmiDate = nextPendingEmi ? nextPendingEmi.dueDate : null;
    
    // Update current LTV
    if (loan.totalCollateralValue > 0) {
      loan.currentLTV = (loan.outstandingAmount / loan.totalCollateralValue) * 100;
    }
    
    // Check if loan is fully paid
    if (loan.outstandingAmount <= 0 || !nextPendingEmi) {
      loan.status = 'closed';
      loan.closedAt = new Date();
      loan.closureReason = 'fully_paid';
      
      // Release collaterals
      await Collateral.updateMany(
        { linkedLoan: loan._id },
        { 
          lienStatus: 'released',
          lienReleasedDate: new Date(),
          linkedLoan: null,
        }
      );
    }
    
    // Check for overdue status
    const hasOverdue = loan.emiSchedule.some(e => e.status === 'overdue');
    if (hasOverdue && loan.status !== 'closed') {
      loan.status = 'overdue';
    } else if (!hasOverdue && loan.status === 'overdue') {
      loan.status = 'active';
    }
    
    await loan.save();
    
    res.json({
      success: true,
      data: loan,
      message: `Payment of ₹${amount} recorded for EMI #${emiNumber}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update loan status (for overdue marking etc.)
 * @route   PATCH /api/loans/:id/status
 * @access  Private (Admin)
 */
exports.updateLoanStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found',
      });
    }
    
    const validStatuses = ['active', 'overdue', 'closed', 'defaulted', 'restructured'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }
    
    loan.status = status;
    
    if (status === 'closed') {
      loan.closedAt = new Date();
    }
    
    await loan.save();
    
    res.json({
      success: true,
      data: loan,
      message: `Loan status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark overdue EMIs (scheduled job endpoint)
 * @route   POST /api/loans/mark-overdue
 * @access  Private (System)
 */
exports.markOverdueEmis = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all active loans with pending EMIs past due date
    const loans = await Loan.find({
      status: { $in: ['active', 'overdue'] },
      'emiSchedule.status': 'pending',
    });
    
    let updatedCount = 0;
    
    for (const loan of loans) {
      let hasUpdates = false;
      
      loan.emiSchedule.forEach(emi => {
        if (emi.status === 'pending' && new Date(emi.dueDate) < today) {
          emi.status = 'overdue';
          hasUpdates = true;
        }
      });
      
      if (hasUpdates) {
        loan.status = 'overdue';
        await loan.save();
        updatedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Marked overdue EMIs for ${updatedCount} loans`,
    });
  } catch (error) {
    next(error);
  }
};
