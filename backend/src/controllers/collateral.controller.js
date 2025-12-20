/**
 * Collateral Controller
 * 
 * Handles operations for mutual fund collateral management
 * including NAV updates, lien marking, and releasing.
 */

const Collateral = require('../models/Collateral.model');

/**
 * @desc    Get all collaterals
 * @route   GET /api/collaterals
 * @access  Public
 */
exports.getAllCollaterals = async (req, res, next) => {
  try {
    const { 
      lienStatus, 
      schemeType, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const query = {};
    
    if (lienStatus && lienStatus !== 'all') {
      query.lienStatus = lienStatus;
    }
    
    if (schemeType && schemeType !== 'all') {
      query.schemeType = schemeType;
    }
    
    if (search) {
      query.$or = [
        { fundName: { $regex: search, $options: 'i' } },
        { folioNumber: { $regex: search, $options: 'i' } },
        { amcName: { $regex: search, $options: 'i' } },
        { investorName: { $regex: search, $options: 'i' } },
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [collaterals, total] = await Promise.all([
      Collateral.find(query)
        .populate('linkedApplication', 'applicationNumber')
        .populate('linkedLoan', 'loanNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Collateral.countDocuments(query),
    ]);
    
    // Calculate summary stats
    const stats = await Collateral.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$currentValue' },
          totalUnits: { $sum: '$units' },
          count: { $sum: 1 },
        },
      },
    ]);
    
    const lienStats = await Collateral.aggregate([
      {
        $group: {
          _id: '$lienStatus',
          value: { $sum: '$currentValue' },
          count: { $sum: 1 },
        },
      },
    ]);
    
    res.json({
      success: true,
      data: collaterals,
      stats: {
        total: stats[0] || { totalValue: 0, totalUnits: 0, count: 0 },
        byLienStatus: lienStats,
      },
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
 * @desc    Get single collateral
 * @route   GET /api/collaterals/:id
 * @access  Public
 */
exports.getCollateral = async (req, res, next) => {
  try {
    const collateral = await Collateral.findById(req.params.id)
      .populate('linkedApplication')
      .populate('linkedLoan');
    
    if (!collateral) {
      return res.status(404).json({
        success: false,
        error: 'Collateral not found',
      });
    }
    
    res.json({
      success: true,
      data: collateral,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new collateral (register MF units)
 * @route   POST /api/collaterals
 * @access  Private
 */
exports.createCollateral = async (req, res, next) => {
  try {
    const {
      fundName,
      folioNumber,
      units,
      navPerUnit,
      amcName,
      schemeType,
      isin,
      investorName,
      investorPan,
    } = req.body;
    
    // Check if folio already exists
    const existingCollateral = await Collateral.findOne({ folioNumber });
    if (existingCollateral) {
      return res.status(400).json({
        success: false,
        error: 'Collateral with this folio number already exists',
      });
    }
    
    const collateral = await Collateral.create({
      fundName,
      folioNumber,
      units,
      navPerUnit,
      currentValue: units * navPerUnit,
      amcName,
      schemeType,
      isin,
      investorName,
      investorPan,
      navLastUpdated: new Date(),
    });
    
    res.status(201).json({
      success: true,
      data: collateral,
      message: 'Collateral registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update collateral
 * @route   PUT /api/collaterals/:id
 * @access  Private
 */
exports.updateCollateral = async (req, res, next) => {
  try {
    const { units, navPerUnit, ...otherFields } = req.body;
    
    const collateral = await Collateral.findById(req.params.id);
    
    if (!collateral) {
      return res.status(404).json({
        success: false,
        error: 'Collateral not found',
      });
    }
    
    // Update fields
    if (units !== undefined) collateral.units = units;
    if (navPerUnit !== undefined) {
      collateral.navPerUnit = navPerUnit;
      collateral.navLastUpdated = new Date();
    }
    
    Object.assign(collateral, otherFields);
    
    // Recalculate value
    collateral.currentValue = collateral.units * collateral.navPerUnit;
    
    await collateral.save();
    
    res.json({
      success: true,
      data: collateral,
      message: 'Collateral updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark lien on collateral
 * @route   POST /api/collaterals/:id/lien
 * @access  Private
 */
exports.markLien = async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    
    const collateral = await Collateral.findById(req.params.id);
    
    if (!collateral) {
      return res.status(404).json({
        success: false,
        error: 'Collateral not found',
      });
    }
    
    if (collateral.lienStatus === 'marked') {
      return res.status(400).json({
        success: false,
        error: 'Lien already marked on this collateral',
      });
    }
    
    collateral.lienStatus = 'marked';
    collateral.lienMarkedDate = new Date();
    if (applicationId) {
      collateral.linkedApplication = applicationId;
    }
    
    await collateral.save();
    
    res.json({
      success: true,
      data: collateral,
      message: 'Lien marked successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Release lien on collateral
 * @route   POST /api/collaterals/:id/release
 * @access  Private
 */
exports.releaseLien = async (req, res, next) => {
  try {
    const collateral = await Collateral.findById(req.params.id);
    
    if (!collateral) {
      return res.status(404).json({
        success: false,
        error: 'Collateral not found',
      });
    }
    
    if (collateral.lienStatus !== 'marked') {
      return res.status(400).json({
        success: false,
        error: 'No lien marked on this collateral',
      });
    }
    
    // Check if linked loan is still active
    if (collateral.linkedLoan) {
      const Loan = require('../models/Loan.model');
      const loan = await Loan.findById(collateral.linkedLoan);
      
      if (loan && loan.status === 'active') {
        return res.status(400).json({
          success: false,
          error: 'Cannot release lien while loan is active',
        });
      }
    }
    
    collateral.lienStatus = 'released';
    collateral.lienReleasedDate = new Date();
    collateral.linkedApplication = null;
    collateral.linkedLoan = null;
    
    await collateral.save();
    
    res.json({
      success: true,
      data: collateral,
      message: 'Lien released successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk update NAV for all collaterals
 * @route   POST /api/collaterals/update-nav
 * @access  Private (System/Admin)
 */
exports.updateNav = async (req, res, next) => {
  try {
    const { navUpdates } = req.body;
    
    // navUpdates should be an array of { folioNumber, newNav }
    if (!Array.isArray(navUpdates)) {
      return res.status(400).json({
        success: false,
        error: 'navUpdates must be an array',
      });
    }
    
    const updatePromises = navUpdates.map(async ({ folioNumber, newNav }) => {
      const collateral = await Collateral.findOne({ folioNumber });
      if (collateral) {
        collateral.navPerUnit = newNav;
        collateral.currentValue = collateral.units * newNav;
        collateral.navLastUpdated = new Date();
        return collateral.save();
      }
      return null;
    });
    
    const results = await Promise.all(updatePromises);
    const updated = results.filter(r => r !== null).length;
    
    res.json({
      success: true,
      message: `NAV updated for ${updated} collaterals`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get collaterals by scheme type summary
 * @route   GET /api/collaterals/summary
 * @access  Public
 */
exports.getCollateralSummary = async (req, res, next) => {
  try {
    const summary = await Collateral.aggregate([
      {
        $group: {
          _id: '$schemeType',
          totalValue: { $sum: '$currentValue' },
          totalUnits: { $sum: '$units' },
          count: { $sum: 1 },
          avgNav: { $avg: '$navPerUnit' },
        },
      },
      {
        $project: {
          schemeType: '$_id',
          totalValue: 1,
          totalUnits: 1,
          count: 1,
          avgNav: { $round: ['$avgNav', 2] },
          _id: 0,
        },
      },
    ]);
    
    const lienSummary = await Collateral.aggregate([
      {
        $group: {
          _id: '$lienStatus',
          totalValue: { $sum: '$currentValue' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          lienStatus: '$_id',
          totalValue: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);
    
    res.json({
      success: true,
      data: {
        bySchemeType: summary,
        byLienStatus: lienSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};
