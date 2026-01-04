const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

const authMiddleware = require('../middleware/authMiddleware');
const {
  getPatientProfile,
  updatePatientProfile,
  getPatientGlucose,
  addGlucoseRecord,
  getPatientMedications,
  addMedication,
  updateMedication,
  deleteMedication,
  getPatientPrescriptions,
  getPatientLabs,
  uploadPatientLabResult,
  getPatientAppointments,
  getPatientNotifications,
  markPatientNotificationRead,
  uploadPatientLab
} = require('../controllers/patientController');
const { exportPatientReport } = require('../controllers/exportController');

router.get('/profile', authMiddleware, getPatientProfile);
router.put('/profile', authMiddleware, updatePatientProfile);
router.get('/glucose', authMiddleware, getPatientGlucose);
router.post('/glucose', authMiddleware, addGlucoseRecord);
router.get('/medications', authMiddleware, getPatientMedications);
router.post('/medications', authMiddleware, addMedication);
router.put('/medications/:id', authMiddleware, updateMedication);
router.delete('/medications/:id', authMiddleware, deleteMedication);
router.get('/prescriptions', authMiddleware, getPatientPrescriptions);
router.get('/labs', authMiddleware, getPatientLabs);
router.post('/lab/upload/:id', authMiddleware, upload.single('file'), uploadPatientLabResult);
router.get('/appointments', authMiddleware, getPatientAppointments);
router.get('/notifications', authMiddleware, getPatientNotifications);
router.put('/notification/read/:id', authMiddleware, markPatientNotificationRead);

// PDF export endpoint
router.get('/:id/export', authMiddleware, exportPatientReport);

module.exports = router;