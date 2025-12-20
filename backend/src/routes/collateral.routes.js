const express = require('express');
const router = express.Router();
const { getAllCollaterals, getCollateral, createCollateral, updateCollateral, markLien, releaseLien, updateNav, getCollateralSummary } = require('../controllers/collateral.controller');

router.route('/').get(getAllCollaterals).post(createCollateral);
router.get('/summary', getCollateralSummary);
router.post('/update-nav', updateNav);
router.route('/:id').get(getCollateral).put(updateCollateral);
router.post('/:id/lien', markLien);
router.post('/:id/release', releaseLien);

module.exports = router;
