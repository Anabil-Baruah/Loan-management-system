/**
 * Loan Application Controller
 * 
 * Handles CRUD operations and workflow for loan applications.
 * Includes API endpoints for external fintech integrations.
 */

const LoanApplication = require('../models/LoanApplication.model');
const LoanProduct = require('../models/LoanProduct.model');
const Collateral = require('../models/Collateral.model');
const Loan = require('../models/Loan.model');

/**
 * @desc    Get all loan applications
 * @route   GET /api/applications
 * @access  Public
 */
exports.getAllApplications = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } },
        { 'applicant.name': { $regex: search, $options: 'i' } },
        { 'applicant.email': { $regex: search, $options: 'i' } },
        { 'applicant.pan': { $regex: search, $options: 'i' } },
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [applications, total] = await Promise.all([
      LoanApplication.find(query)
        .populate('loanProduct', 'name interestRate maxLTV')
        .populate('collaterals', 'fundName folioNumber currentValue')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LoanApplication.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      data: applications,
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
 * @desc    Get single loan application
 * @route   GET /api/applications/:id
 * @access  Public
 */
exports.getApplication = async (req, res, next) => {
  try {
    const application = await LoanApplication.findById(req.params.id)
      .populate('loanProduct')
      .populate('collaterals');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }
    
    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new loan application
 * @route   POST /api/applications
 * @access  Public (API for fintech partners)
 * 
 * This endpoint is designed to be used by external fintech companies
 * to submit loan applications programmatically.
 */
exports.createApplication = async (req, res, next) => {
  try {
    const {
      applicant,
      loanProductId,
      requestedAmount,
      tenure,
      collateralFolios,
    } = req.body;
    
    // Validate loan product
    const loanProduct = await LoanProduct.findById(loanProductId);
    if (!loanProduct) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loan product',
      });
    }
    
    if (loanProduct.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Loan product is not active',
      });
    }
    
    // Validate amount against product limits
    if (requestedAmount < loanProduct.minAmount || requestedAmount > loanProduct.maxAmount) {
      return res.status(400).json({
        success: false,
        error: `Requested amount must be between ${loanProduct.minAmount} and ${loanProduct.maxAmount}`,
      });
    }
    
    // Validate tenure against product limits
    if (tenure < loanProduct.minTenure || tenure > loanProduct.maxTenure) {
      return res.status(400).json({
        success: false,
        error: `Tenure must be between ${loanProduct.minTenure} and ${loanProduct.maxTenure} months`,
      });
    }
    
    // Find and validate collaterals
    let collaterals = [];
    let totalCollateralValue = 0;
    
    if (collateralFolios && collateralFolios.length > 0) {
      collaterals = await Collateral.find({
        folioNumber: { $in: collateralFolios },
        lienStatus: 'none',
      });
      
      if (collaterals.length !== collateralFolios.length) {
        return res.status(400).json({
          success: false,
          error: 'Some collaterals are invalid or already pledged',
        });
      }
      
      totalCollateralValue = collaterals.reduce((sum, c) => sum + c.currentValue, 0);
    }
    
    // Calculate LTV
    const ltv = totalCollateralValue > 0 
      ? (requestedAmount / totalCollateralValue) * 100 
      : 0;
    
    // Validate LTV against product limits
    if (ltv > loanProduct.maxLTV) {
      return res.status(400).json({
        success: false,
        error: `LTV (${ltv.toFixed(2)}%) exceeds maximum allowed (${loanProduct.maxLTV}%)`,
      });
    }
    
    // Create application
    const application = await LoanApplication.create({
      applicant,
      loanProduct: loanProductId,
      requestedAmount,
      tenure,
      interestRate: loanProduct.interestRate,
      collaterals: collaterals.map(c => c._id),
      totalCollateralValue,
      ltv,
      status: 'submitted',
      submittedAt: new Date(),
    });
    
    // Mark collaterals as reserved
    if (collaterals.length > 0) {
      await Collateral.updateMany(
        { _id: { $in: collaterals.map(c => c._id) } },
        { 
          linkedApplication: application._id,
          lienStatus: 'marked',
          lienMarkedDate: new Date(),
        }
      );
    }
    
    // Populate and return
    const populatedApplication = await LoanApplication.findById(application._id)
      .populate('loanProduct', 'name interestRate maxLTV')
      .populate('collaterals');
    
    res.status(201).json({
      success: true,
      data: populatedApplication,
      message: 'Loan application created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update loan application
 * @route   PUT /api/applications/:id
 * @access  Private
 */
exports.updateApplication = async (req, res, next) => {
  try {
    const application = await LoanApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }
    
    // Only allow updates if application is in draft or submitted status
    if (!['draft', 'submitted'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update application in current status',
      });
    }
    
    const updatedApplication = await LoanApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('loanProduct')
      .populate('collaterals');
    
    res.json({
      success: true,
      data: updatedApplication,
      message: 'Application updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update application status
 * @route   PATCH /api/applications/:id/status
 * @access  Private (Admin)
 */
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, remarks, approvedAmount } = req.body;
    const application = await LoanApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }
    
    // Validate status transitions
    const validTransitions = {
      draft: ['submitted'],
      submitted: ['under_review', 'rejected'],
      under_review: ['approved', 'rejected'],
      approved: ['disbursed', 'rejected'],
      rejected: [],
      disbursed: ['closed'],
      closed: [],
    };
    
    if (!validTransitions[application.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from ${application.status} to ${status}`,
      });
    }
    
    // Update status and relevant timestamps
    application.status = status;
    application.remarks = remarks || application.remarks;
    
    switch (status) {
      case 'submitted':
        application.submittedAt = new Date();
        break;
      case 'approved':
        application.approvedAt = new Date();
        application.approvedAmount = approvedAmount || application.requestedAmount;
        break;
      case 'rejected':
        application.rejectedAt = new Date();
        // Release collaterals
        await Collateral.updateMany(
          { linkedApplication: application._id },
          { 
            lienStatus: 'released',
            lienReleasedDate: new Date(),
            linkedApplication: null,
          }
        );
        break;
      case 'disbursed':
        application.disbursedAt = new Date();
        // Create loan record
        await createLoanFromApplication(application);
        break;
      case 'closed':
        application.closedAt = new Date();
        break;
    }
    
    await application.save();
    
    const updatedApplication = await LoanApplication.findById(application._id)
      .populate('loanProduct')
      .populate('collaterals');
    
    res.json({
      success: true,
      data: updatedApplication,
      message: `Application status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete loan application
 * @route   DELETE /api/applications/:id
 * @access  Private (Admin)
 */
exports.deleteApplication = async (req, res, next) => {
  try {
    const application = await LoanApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }
    
    // Only allow deletion of draft applications
    if (application.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Only draft applications can be deleted',
      });
    }
    
    await LoanApplication.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to create loan from approved application
async function createLoanFromApplication(application) {
  const populatedApp = await LoanApplication.findById(application._id)
    .populate('loanProduct')
    .populate('collaterals');
  
  const amount = populatedApp.approvedAmount || populatedApp.requestedAmount;
  const monthlyRate = populatedApp.interestRate / 12 / 100;
  const tenure = populatedApp.tenure;
  
  // Calculate EMI using standard formula
  const emi = amount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / 
              (Math.pow(1 + monthlyRate, tenure) - 1);
  
  const loan = new Loan({
    application: application._id,
    applicant: populatedApp.applicant,
    loanProduct: populatedApp.loanProduct._id,
    disbursedAmount: amount,
    outstandingAmount: amount,
    tenure,
    interestRate: populatedApp.interestRate,
    emiAmount: Math.round(emi * 100) / 100,
    collaterals: populatedApp.collaterals.map(c => c._id),
    totalCollateralValue: populatedApp.totalCollateralValue,
    currentLTV: populatedApp.ltv,
    status: 'active',
    disbursedAt: new Date(),
  });
  
  // Generate EMI schedule
  loan.generateEmiSchedule();
  
  // Set next EMI date
  if (loan.emiSchedule.length > 0) {
    loan.nextEmiDate = loan.emiSchedule[0].dueDate;
  }
  
  await loan.save();
  
  // Update collaterals with loan reference
  await Collateral.updateMany(
    { _id: { $in: populatedApp.collaterals.map(c => c._id) } },
    { linkedLoan: loan._id }
  );
  
  return loan;
}
