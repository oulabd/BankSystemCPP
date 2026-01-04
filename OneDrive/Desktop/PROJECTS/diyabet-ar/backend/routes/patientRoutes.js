const express = require('express');
const router = express.Router();
const { authMiddleware, permit } = require('../middleware/auth');
const { getProfile, updateProfile, sendQuestion, addRecord, updateRecord, deleteRecord, getMyRecords, getMyPrescriptions, getMyLabRequests, uploadLabResult, getInsulinAdjustments, getPrescriptionPDF, getChatMessages, sendChatMessage, markMessageAsRead, getNotifications, getUnreadCount, markNotificationAsRead, requestPrescriptionRenewal, getMedicalLogs, exportMedicalReport, createAppointment, getMyAppointments, cancelAppointment, changePassword } = require('../controllers/patientController');
const { exportPatientReport } = require('../controllers/exportController');
const { uploadLabReport } = require('../controllers/labReportController');
const { getMyLabReports } = require('../controllers/labReportPatientController');
const { getPrescriptionForPatient, generatePrescriptionPDF } = require('../controllers/doctorController');
const { updateAppointmentStatus } = require('../controllers/doctorController');
const {
  calculateAndSaveCarbs,
  getDailyCarbSummary,
  deleteCarbEntry,
  searchFoodByName,
} = require('../controllers/patientCarbController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/labs/' });

router.get('/profile', authMiddleware, permit('patient', 'doctor', 'admin'), getProfile);
router.put('/profile', authMiddleware, permit('patient'), updateProfile);
router.post('/change-password', authMiddleware, permit('patient'), changePassword);
router.post('/question', authMiddleware, permit('patient'), sendQuestion);
router.post('/records', authMiddleware, permit('patient'), addRecord);
router.put('/records/:id', authMiddleware, permit('patient'), updateRecord);
router.delete('/records/:id', authMiddleware, permit('patient'), deleteRecord);
const { getPatientRecords } = require('../controllers/patientController');
router.get('/records', authMiddleware, permit('patient'), getPatientRecords);
router.get('/prescriptions', authMiddleware, permit('patient'), getMyPrescriptions);
router.post('/prescriptions/renew/:id', authMiddleware, permit('patient'), requestPrescriptionRenewal);
router.post('/carbs/calculate', authMiddleware, permit('patient'), calculateAndSaveCarbs);
router.get('/carbs/daily', authMiddleware, permit('patient'), getDailyCarbSummary);
router.delete('/carbs/:id', authMiddleware, permit('patient'), deleteCarbEntry);
router.get('/food/search', authMiddleware, permit('patient'), searchFoodByName);
router.get('/labs', authMiddleware, permit('patient'), getMyLabRequests);
// New: fetch all uploaded lab reports for patient (LabReport model)
router.get('/labs/reports', authMiddleware, permit('patient'), getMyLabReports);
router.put('/labs/upload/:id', upload.single('file'), authMiddleware, permit('patient'), uploadLabResult);
router.post('/labs/upload', upload.single('file'), authMiddleware, permit('patient'), uploadLabReport);
router.get('/insulin', authMiddleware, permit('patient'), getInsulinAdjustments);
router.get('/prescriptions/:id', authMiddleware, permit('patient', 'doctor'), getPrescriptionForPatient);
router.get('/prescriptions/pdf/:id', authMiddleware, permit('patient', 'doctor'), generatePrescriptionPDF);
router.get('/chat/:withUser', authMiddleware, permit('patient'), getChatMessages);
router.post('/chat/send', authMiddleware, permit('patient'), sendChatMessage);
router.post('/chat/read/:id', authMiddleware, permit('patient'), markMessageAsRead);
router.get('/notifications', authMiddleware, permit('patient'), getNotifications);
router.get('/notifications/unread', authMiddleware, permit('patient'), getUnreadCount);
router.put('/notifications/read/:id', authMiddleware, permit('patient'), markNotificationAsRead);

router.get('/logs', authMiddleware, permit('patient'), getMedicalLogs);

router.post('/appointments', authMiddleware, permit('patient'), createAppointment);
router.get('/appointments/my', authMiddleware, permit('patient'), getMyAppointments);
router.delete('/appointments/:id', authMiddleware, permit('patient'), cancelAppointment);
router.patch('/appointments/:id/status', authMiddleware, permit('doctor'), updateAppointmentStatus);

router.get('/:id/export', authMiddleware, permit('patient', 'doctor'), exportPatientReport);

module.exports = router;
