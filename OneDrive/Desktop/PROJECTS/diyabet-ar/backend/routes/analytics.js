const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getWeeklyGlucose,
  getMonthlyGlucose,
  getGlucoseTrends,
  getInsulinImpact
} = require('../controllers/analyticsController');

router.use(authMiddleware);

router.get('/glucose/weekly', getWeeklyGlucose);
router.get('/glucose/monthly', getMonthlyGlucose);
router.get('/glucose/trends', getGlucoseTrends);
router.get('/glucose/insulin-impact', getInsulinImpact);

module.exports = router;
