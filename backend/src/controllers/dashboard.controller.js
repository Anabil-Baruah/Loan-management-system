/**
 * Dashboard Controller
 * 
 * Provides aggregated statistics and metrics for the dashboard.
 */

const LoanApplication = require('../models/LoanApplication.model');
const Loan = require('../models/Loan.model');
const Collateral = require('../models/Collateral.model');
const LoanProduct = require('../models/LoanProduct.model');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Public
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Application statistics
    const applicationStats = await LoanApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$requestedAmount' },
        },
      },
    ]);
    
    // Loan statistics
    const loanStats = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDisbursed: { $sum: '$disbursedAmount' },
          totalOutstanding: { $sum: '$outstandingAmount' },
        },
      },
    ]);
    
    // Collateral statistics
    const collateralStats = await Collateral.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$currentValue' },
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Calculate LTV average for active loans
    const ltvStats = await Loan.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          avgLTV: { $avg: '$currentLTV' },
        },
      },
    ]);
    
    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrends = await LoanApplication.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          applications: { $sum: 1 },
          totalAmount: { $sum: '$requestedAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    
    // Format statistics
    const totalApplications = applicationStats.reduce((sum, s) => sum + s.count, 0);
    const pendingApplications = applicationStats
      .filter(s => ['submitted', 'under_review'].includes(s._id))
      .reduce((sum, s) => sum + s.count, 0);
    const approvedApplications = applicationStats
      .find(s => s._id === 'approved')?.count || 0;
    
    const activeLoans = loanStats.find(s => s._id === 'active') || { count: 0, totalDisbursed: 0, totalOutstanding: 0 };
    const overdueLoans = loanStats.find(s => s._id === 'overdue')?.count || 0;
    
    const totalDisbursed = loanStats.reduce((sum, s) => sum + (s.totalDisbursed || 0), 0);
    const totalOutstanding = loanStats.reduce((sum, s) => sum + (s.totalOutstanding || 0), 0);
    
    res.json({
      success: true,
      data: {
        totalApplications,
        pendingApplications,
        approvedApplications,
        totalDisbursed,
        totalOutstanding,
        activeLoans: activeLoans.count,
        overdueLoans,
        totalCollateralValue: collateralStats[0]?.totalValue || 0,
        averageLTV: Math.round((ltvStats[0]?.avgLTV || 0) * 10) / 10,
        applicationsByStatus: applicationStats,
        loansByStatus: loanStats,
        monthlyTrends: monthlyTrends.map(t => ({
          month: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
          applications: t.applications,
          totalAmount: t.totalAmount,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent activity
 * @route   GET /api/dashboard/activity
 * @access  Public
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Recent applications
    const recentApplications = await LoanApplication.find()
      .select('applicationNumber applicant.name status createdAt requestedAmount')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    // Recent payments
    const recentPayments = await Loan.aggregate([
      { $unwind: '$emiSchedule' },
      { $match: { 'emiSchedule.status': 'paid' } },
      { $sort: { 'emiSchedule.paidDate': -1 } },
      { $limit: limit },
      {
        $project: {
          loanNumber: 1,
          borrowerName: '$applicant.name',
          emiNumber: '$emiSchedule.emiNumber',
          amount: '$emiSchedule.paidAmount',
          paidDate: '$emiSchedule.paidDate',
        },
      },
    ]);
    
    res.json({
      success: true,
      data: {
        recentApplications,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};
