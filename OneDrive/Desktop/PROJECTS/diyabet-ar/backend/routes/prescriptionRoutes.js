const express = require('express');
const router = express.Router();

const prescriptionController = require('../controllers/prescriptionController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// Create prescription (doctor or admin)
router.post('/', authMiddleware, roleMiddleware(['doctor', 'admin']), prescriptionController.createPrescription);

// Update prescription (doctor or admin)
router.put('/:id', authMiddleware, roleMiddleware(['doctor', 'admin']), prescriptionController.updatePrescription);

// Renew prescription (doctor or admin)
router.post('/:id/renew', authMiddleware, roleMiddleware(['doctor', 'admin']), prescriptionController.renewPrescription);

// Patient gets their prescriptions
router.get('/me', authMiddleware, roleMiddleware('patient'), prescriptionController.getMyPrescriptions);

// Doctor or admin view a patient's prescriptions
router.get('/patient/:id', authMiddleware, roleMiddleware(['doctor', 'admin']), prescriptionController.getPatientPrescriptions);

// Admin only: permanent delete
router.delete('/:id', authMiddleware, roleMiddleware('admin'), prescriptionController.deletePrescription);

module.exports = router;
