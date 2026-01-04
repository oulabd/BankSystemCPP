
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const doctor = require('../controllers/doctorController');
const { authMiddleware, permit } = require('../middleware/auth');

// Get prescriptions for a specific patient
router.get('/prescriptions/patient/:id', doctor.listPrescriptions);

// router.post('/login', doctor.login); // Deprecated or not exported, remove or comment out

// Protected routes
router.use(authMiddleware);
router.use(permit('doctor'));

// Lab reports (uploaded results)
router.get('/lab-reports/:patientId', doctor.getLabReportsForPatient);
const { auth, doctorOnly } = require('../middleware/auth');

// Remove duplicate middleware, as router.use(authMiddleware) and router.use(permit('doctor')) are already applied above
router.get('/appointments', doctor.getDoctorAppointments);
router.get('/patients', doctor.listPatients);
router.get('/labs', doctor.listAllLabRequests);
router.get('/patient/:id/details', doctor.getPatientDetails);
// Inline require to avoid circular dependency
router.get('/patient/:id/records', require('../controllers/patientController').getPatientRecordsById);
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
// router.post('/insulin-adjust', doctor.createInsulinAdjustment); // Removed: not implemented
// router.get('/insulin/:patientId', doctor.getInsulinAdjustmentsForPatient); // Removed: not implemented

// Chat
router.get('/chat/:patientId', doctor.getChatMessages);
router.post('/chat/:patientId', doctor.sendChatMessage);
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

// Patient instructions
router.post('/patient/:id/instruction', doctor.addPatientInstruction);
router.get('/patient/:id/instructions', doctor.getPatientInstructions);
// Add DELETE route for patient instructions
router.delete('/patient/:id/instructions/:instructionId', doctor.deletePatientInstruction);

// Doctor notes for a patient
const deleteDoctorReview = require('../controllers/deleteDoctorReview');
router.delete('/review/:reviewId', deleteDoctorReview);
router.get('/patient/:id/notes', doctor.getPatientNotes);

module.exports = router;

