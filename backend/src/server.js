/**
 * LMS Backend Server Entry Point
 * 
 * This file initializes the Express server, connects to MongoDB,
 * and sets up all middleware and routes.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');

// Import routes
const dashboardRoutes = require('./routes/dashboard.routes');
const loanProductRoutes = require('./routes/loanProduct.routes');
const applicationRoutes = require('./routes/application.routes');
const loanRoutes = require('./routes/loan.routes');
const collateralRoutes = require('./routes/collateral.routes');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request Logging
app.use(morgan(process.env.LOG_LEVEL || 'dev'));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api';

app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/loan-products`, loanProductRoutes);
app.use(`${apiPrefix}/applications`, applicationRoutes);
app.use(`${apiPrefix}/loans`, loanRoutes);
app.use(`${apiPrefix}/collaterals`, collateralRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Documentation Endpoint
app.get(`${apiPrefix}`, (req, res) => {
  res.json({
    message: 'LMS API - Loan Management System for LAMF',
    version: '1.0.0',
    endpoints: {
      dashboard: `${apiPrefix}/dashboard`,
      loanProducts: `${apiPrefix}/loan-products`,
      applications: `${apiPrefix}/applications`,
      loans: `${apiPrefix}/loans`,
      collaterals: `${apiPrefix}/collaterals`,
    },
    documentation: 'See README.md for detailed API documentation',
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     LMS Backend Server Started Successfully!               ║
║                                                            ║
║     🚀 Server:     http://localhost:${PORT}                   ║
║     📚 API Base:   http://localhost:${PORT}${apiPrefix}              ║
║     💚 Health:     http://localhost:${PORT}/health             ║
║     🌍 Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
