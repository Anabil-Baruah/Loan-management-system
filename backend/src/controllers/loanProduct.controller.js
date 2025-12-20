/**
 * Loan Product Controller
 * 
 * Handles all CRUD operations for loan products.
 */

const LoanProduct = require('../models/LoanProduct.model');

/**
 * @desc    Get all loan products
 * @route   GET /api/loan-products
 * @access  Public
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      LoanProduct.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LoanProduct.countDocuments(query),
    ]);
    
    res.json({
      success: true,
      data: products,
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
 * @desc    Get single loan product
 * @route   GET /api/loan-products/:id
 * @access  Public
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await LoanProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Loan product not found',
      });
    }
    
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new loan product
 * @route   POST /api/loan-products
 * @access  Private (Admin)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      interestRate,
      minAmount,
      maxAmount,
      minTenure,
      maxTenure,
      maxLTV,
      processingFee,
      status,
    } = req.body;
    
    const product = await LoanProduct.create({
      name,
      description,
      interestRate,
      minAmount,
      maxAmount,
      minTenure,
      maxTenure,
      maxLTV,
      processingFee,
      status: status || 'active',
    });
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Loan product created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update loan product
 * @route   PUT /api/loan-products/:id
 * @access  Private (Admin)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await LoanProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Loan product not found',
      });
    }
    
    res.json({
      success: true,
      data: product,
      message: 'Loan product updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete loan product
 * @route   DELETE /api/loan-products/:id
 * @access  Private (Admin)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await LoanProduct.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Loan product not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Loan product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
