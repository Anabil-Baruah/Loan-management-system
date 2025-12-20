const express = require('express');
const router = express.Router();
const { getAllLoans, getLoan, getEmiSchedule, recordPayment, updateLoanStatus, markOverdueEmis } = require('../controllers/loan.controller');

router.route('/').get(getAllLoans);
router.post('/mark-overdue', markOverdueEmis);
router.route('/:id').get(getLoan);
router.get('/:id/emi-schedule', getEmiSchedule);
router.post('/:id/payment', recordPayment);
router.patch('/:id/status', updateLoanStatus);

module.exports = router;
