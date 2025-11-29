const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/roleMiddleware');
const { getProfile, sendQuestion, addRecord, getMyRecords, getMyPrescriptions, getMyLabRequests, uploadLabResult, getInsulinAdjustments, getPrescriptionPDF, getChatMessages, sendChatMessage, markMessageAsRead, getNotifications, getUnreadCount, markNotificationAsRead, requestPrescriptionRenewal, getMedicalLogs, exportMedicalReport, createAppointment, getMyAppointments, cancelAppointment } = require('../controllers/patientController');
const { getPrescriptionForPatient, generatePrescriptionPDF } = require('../controllers/doctorController');
const { updateAppointmentStatus } = require('../controllers/doctorController');
const {
  calculateAndSaveCarbs,
  getDailyCarbSummary,
  deleteCarbEntry,
} = require('../controllers/patientCarbController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/labs/' });

router.get('/profile', auth, permit('patient', 'doctor', 'admin'), getProfile);
router.post('/question', auth, permit('patient'), sendQuestion);
router.post('/records', auth, permit('patient'), addRecord);
router.get('/records', auth, permit('patient'), getMyRecords);
router.get('/prescriptions', auth, permit('patient'), getMyPrescriptions);
router.post('/prescriptions/renew/:id', auth, permit('patient'), requestPrescriptionRenewal);
router.post('/carbs/calculate', auth, permit('patient'), calculateAndSaveCarbs);
router.get('/carbs/daily', auth, permit('patient'), getDailyCarbSummary);
router.delete('/carbs/:id', auth, permit('patient'), deleteCarbEntry);
router.get('/labs', auth, permit('patient'), getMyLabRequests);
router.put('/labs/upload/:id', upload.single('file'), auth, permit('patient'), uploadLabResult);
router.get('/insulin', auth, permit('patient'), getInsulinAdjustments);
router.get('/prescriptions/:id', auth, permit('patient', 'doctor'), getPrescriptionForPatient);
router.get('/prescriptions/pdf/:id', auth, permit('patient', 'doctor'), generatePrescriptionPDF);
router.get('/chat/:withUser', auth, permit('patient'), getChatMessages);
router.post('/chat/send', auth, permit('patient'), sendChatMessage);
router.post('/chat/read/:id', auth, permit('patient'), markMessageAsRead);
router.get('/notifications', auth, permit('patient'), getNotifications);
router.get('/notifications/unread', auth, permit('patient'), getUnreadCount);
router.put('/notifications/read/:id', auth, permit('patient'), markNotificationAsRead);

router.get('/logs', auth, permit('patient'), getMedicalLogs);

router.post('/appointments', auth, permit('patient'), createAppointment);
router.get('/appointments/my', auth, permit('patient'), getMyAppointments);
router.delete('/appointments/:id', auth, permit('patient'), cancelAppointment);
router.patch('/appointments/:id/status', auth, permit('doctor'), updateAppointmentStatus);

router.get('/:id/export', auth, permit('patient', 'doctor'), exportMedicalReport);

module.exports = router;
