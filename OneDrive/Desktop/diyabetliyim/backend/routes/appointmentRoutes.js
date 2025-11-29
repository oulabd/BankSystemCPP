const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// PATIENT ROUTES
router.post('/', authMiddleware, roleMiddleware('patient'), appointmentController.createAppointment);
router.get('/my', authMiddleware, roleMiddleware('patient'), appointmentController.getMyAppointmentsForPatient);

// DOCTOR ROUTES
router.get('/doctor', authMiddleware, roleMiddleware('doctor'), appointmentController.getMyAppointmentsForDoctor);
router.put('/status/:id', authMiddleware, roleMiddleware('doctor'), appointmentController.updateStatus);

// ADMIN ROUTES
router.get('/admin', authMiddleware, roleMiddleware('admin'), appointmentController.getAllAppointments);

module.exports = router;