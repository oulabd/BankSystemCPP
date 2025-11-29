const express = require('express');
const router = express.Router();
const { getPatientTimeline } = require('../controllers/timelineController');

// ...existing routes...
router.get('/patient/:id/timeline', getPatientTimeline);

// ...existing code...

module.exports = router;