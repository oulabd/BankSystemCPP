// تحديث رقم هوية المريض
const { updatePatientIdentityNumber } = require('../controllers/doctorController');
router.put('/patient/:id/identity', updatePatientIdentityNumber);
// تحديث تعليمات محددة للمريض
const { updatePatientInstruction } = require('../controllers/doctorController');
router.patch('/patient/:id/instructions/:instructionId', updatePatientInstruction);
// التعليمات/الملاحظات للمريض
const { addPatientInstruction } = require('../controllers/doctorController');
router.post('/patient/:id/instruction', addPatientInstruction);
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const verifyJWT = require('../middleware/verifyJWT');
const { getPatientTimeline } = require('../controllers/timelineController');
const {
  login,
  listPatients,
  getPatientDetails,
  getPatientRecords,
  addReview,
  createPrescription,
  listPrescriptions,
  getPrescriptionForPatient,
  updatePrescription,
  deletePrescription,
  generatePrescriptionPDF,
  verifyPrescription,
  createLabRequest,
  getLabRequestsForPatient,
  listAllLabRequests,
  reviewLabResult,
  deleteLabRequest,
  createInsulinAdjustment,
  getInsulinAdjustmentsForPatient,
  getChatMessages,
  sendChatMessage,
  markMessageAsRead,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  createMedicalLog,
  getMedicalLogs,
  respondAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
  // نقاط نهاية إجراءات الطبيب الجديدة
  addDoctorNote,
  createDoctorPrescription,
  requestLabTest
} = require('../controllers/doctorController');

// تطبيق المصادقة على جميع المسارات
router.use(verifyJWT);

// الحصول على مواعيد الطبيب وطلبات المختبر (للوحة التحكم)
router.get('/appointments', getDoctorAppointments);
router.get('/labs', listAllLabRequests);

// مسارات المريض
router.get('/patients', listPatients);
router.get('/patient/:id', getPatientDetails);
router.get('/patient/:id/records', getPatientRecords);
router.get('/patient/:id/timeline', getPatientTimeline);
router.get('/patient/:id/details', getPatientDetails);
// جديد: الحصول على جميع التعليمات للمريض
const { getPatientInstructions, deletePatientInstruction } = require('../controllers/doctorController');
router.get('/patient/:id/instructions', getPatientInstructions);
// حذف تعليمات محددة للمريض
router.delete('/patient/:id/instructions/:instructionId', deletePatientInstruction);

// مسارات الوصفات الطبية
router.post('/prescription', createPrescription);
router.get('/prescription/:id', getPrescriptionForPatient);
router.put('/prescription/:id', updatePrescription);
router.delete('/prescription/:id', deletePrescription);
router.get('/prescriptions/patient/:id', listPrescriptions);
router.get('/prescription/:id/pdf', generatePrescriptionPDF);

// مسارات المختبر
router.post('/lab-request', createLabRequest);
router.get('/lab-requests/patient/:id', getLabRequestsForPatient);
router.put('/lab-request/:id/review', reviewLabResult);
router.delete('/lab-request/:id', deleteLabRequest);

// مسارات الأنسولين
router.post('/insulin-adjustment', createInsulinAdjustment);
router.get('/insulin-adjustments/patient/:id', getInsulinAdjustmentsForPatient);

// مسارات الدردشة
router.get('/chat/:patientId', getChatMessages);
router.post('/chat/:patientId', sendChatMessage);
router.put('/chat/message/:id/read', markMessageAsRead);

// مسارات الإشعارات
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.put('/notifications/:id/read', markNotificationAsRead);

// مسارات السجل الطبي
router.post('/medical-log', createMedicalLog);
router.get('/medical-logs/patient/:id', getMedicalLogs);

// مسارات المواعيد
router.put('/appointment/:id', updateAppointmentStatus);
router.post('/appointment/:id/respond', respondAppointment);

// تقييمات الطبيب
router.post('/review/:patientId', addReview);

// نقاط نهاية لوحة إجراءات الطبيب
router.post('/note', addDoctorNote);
router.post('/action-prescription', createDoctorPrescription);
router.post('/action-lab-request', requestLabTest);

module.exports = router;