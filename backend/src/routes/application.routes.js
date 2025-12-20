const express = require('express');
const router = express.Router();
const { getAllApplications, getApplication, createApplication, updateApplication, updateApplicationStatus, deleteApplication } = require('../controllers/application.controller');

router.route('/').get(getAllApplications).post(createApplication);
router.route('/:id').get(getApplication).put(updateApplication).delete(deleteApplication);
router.patch('/:id/status', updateApplicationStatus);

module.exports = router;
