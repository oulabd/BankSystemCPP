const express = require('express');
const router = express.Router();
const { postReading, getLatestForPatient } = require('../controllers/sensorController');
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/roleMiddleware');

// Device or authenticated endpoint to post readings
router.post('/read', postReading);

// Patient gets latest reading
router.get('/latest', auth, permit('patient'), getLatestForPatient);

module.exports = router;
