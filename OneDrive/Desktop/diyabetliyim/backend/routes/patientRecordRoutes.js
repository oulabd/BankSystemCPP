const express = require('express');
const router = express.Router();

const patientRecordController = require('../controllers/patientRecordController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// Apply auth + patient role to all routes in this router
router.use(authMiddleware);
router.use(roleMiddleware('patient'));

// POST /api/patient/records
router.post('/records', patientRecordController.createRecord);

// GET /api/patient/records
router.get('/records', patientRecordController.getRecords);

// PUT /api/patient/records/:id
router.put('/records/:id', patientRecordController.updateRecord);

// DELETE /api/patient/records/:id
router.delete('/records/:id', patientRecordController.deleteRecord);

module.exports = router;