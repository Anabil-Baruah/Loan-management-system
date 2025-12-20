const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentActivity } = require('../controllers/dashboard.controller');

router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);

module.exports = router;
