const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  addMedicationRecord,
  getMyMedicationRecords,
  getPatientMedicationRecords,
  recommendMedication,
  updateMedicationRecord,
  deleteMedicationRecord,
  getMedicationStats
} = require('../controllers/medicationController');

// All routes require authentication
router.use(authMiddleware);

router.post('/add', addMedicationRecord);
router.get('/mine', getMyMedicationRecords);
router.get('/patient/:id', getPatientMedicationRecords);
router.post('/recommend', recommendMedication);
router.put('/:id', updateMedicationRecord);
router.delete('/:id', deleteMedicationRecord);
router.get('/stats/:patientId', getMedicationStats);

module.exports = router;
