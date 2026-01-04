// GET /api/patient/timeline
// Returns the same timeline as for doctors, but for the logged-in patient
const { getPatientTimeline } = require('../controllers/timelineController');
const express = require('express');
const router = express.Router();
const { authMiddleware, permit } = require('../middleware/auth');

// Patient timeline (doctor notes, labs, etc)
router.get('/timeline', authMiddleware, permit('patient'), async (req, res) => {
  // Patch req.params.id to be the logged-in patient
  req.params = req.params || {};
  req.params.id = req.user.id;
  return getPatientTimeline(req, res);
});

module.exports = router;
