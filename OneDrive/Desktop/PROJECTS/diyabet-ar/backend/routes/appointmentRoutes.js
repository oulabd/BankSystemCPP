const express = require('express');
const router = express.Router();


const appointmentController = require('../controllers/appointmentController');
const { authMiddleware } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// مسارات المريض

// مسارات المريض


// مسارات المريض
router.post('/', authMiddleware, checkRole('patient'), appointmentController.createAppointment);
router.get('/my', authMiddleware, checkRole('patient'), appointmentController.getMyAppointmentsForPatient);

// مسارات الطبيب
router.get('/doctor', authMiddleware, checkRole('doctor'), appointmentController.getMyAppointmentsForDoctor);
router.put('/status/:id', authMiddleware, checkRole('doctor'), appointmentController.updateStatus);

// مسارات المسؤول
router.get('/admin', authMiddleware, checkRole('admin'), appointmentController.getAllAppointments);

// الحصول على الأوقات المحجوزة لتاريخ وطبيب معينين
router.get('/slots', appointmentController.getBookedSlotsForDate);

module.exports = router;