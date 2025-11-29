const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const doctor = require('../controllers/doctorController');
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/roleMiddleware');

router.post('/login', doctor.login);

// Protected routes
router.use(auth);
router.use(permit('doctor'));

router.get('/patients', doctor.listPatients);
router.get('/patient/:id/details', doctor.getPatientDetails);
router.get('/patient/:id/records', doctor.getPatientRecords);
router.post('/review/:recordId', doctor.addReview);

// Prescriptions
router.post('/prescriptions', doctor.createPrescription);
router.get('/prescriptions', doctor.listPrescriptions);
router.get('/prescriptions/:id', doctor.getPrescriptionForPatient);
router.patch('/prescriptions/:id', doctor.updatePrescription);
router.delete('/prescriptions/:id', doctor.deletePrescription);
router.get('/prescriptions/pdf/:id', doctor.generatePrescriptionPDF);

// Public verification
router.get('/prescriptions/verify/:code', doctor.verifyPrescription);

// Lab requests
router.post('/labs/request/:patientId', doctor.createLabRequest);
router.get('/labs', doctor.listAllLabRequests);
router.get('/labs/:patientId', doctor.getLabRequestsForPatient);
router.put('/labs/review/:id', doctor.reviewLabResult);
router.delete('/labs/:id', doctor.deleteLabRequest);

// Insulin adjustments
router.post('/insulin-adjust', doctor.createInsulinAdjustment);
router.get('/insulin/:patientId', doctor.getInsulinAdjustmentsForPatient);

// Chat
router.get('/chat/:withUser', doctor.getChatMessages);
router.post('/chat/send', doctor.sendChatMessage);
router.post('/chat/read/:id', doctor.markMessageAsRead);

// Notifications
router.get('/notifications', doctor.getNotifications);
router.get('/notifications/unread', doctor.getUnreadCount);
router.put('/notifications/read/:id', doctor.markNotificationAsRead);

// Appointments
router.post('/appointments/:id/respond', doctor.respondAppointment);
router.get('/appointments', doctor.getDoctorAppointments);

// Medical Logs
router.post('/logs', doctor.createMedicalLog);
router.get('/logs/:patientId', doctor.getMedicalLogs);

module.exports = router;

