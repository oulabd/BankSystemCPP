const express = require('express');
const router = express.Router();
const { authMiddleware, permit } = require('../middleware/auth');
const { getPrescriptionQR } = require('../controllers/prescriptionQRController');

// GET /api/patient/prescriptions/:id/qr
router.get('/prescriptions/:id/qr', authMiddleware, permit('patient', 'doctor', 'admin'), getPrescriptionQR);

module.exports = router;
