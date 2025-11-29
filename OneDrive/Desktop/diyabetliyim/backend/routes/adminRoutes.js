const express = require('express');
const router = express.Router();
const { verifyJWT, checkRole } = require('../middleware/auth');
const { getPendingDoctors, approveDoctor, rejectDoctor } = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(verifyJWT);
router.use(checkRole('admin'));

// GET /api/admin/doctors/pending
router.get('/doctors/pending', getPendingDoctors);

// PUT /api/admin/doctors/:id/approve
router.put('/doctors/:id/approve', approveDoctor);

// PUT /api/admin/doctors/:id/reject
router.put('/doctors/:id/reject', rejectDoctor);

module.exports = router;