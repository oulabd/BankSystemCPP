const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const checkRole = require('../middleware/checkRole');
const {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getPatients,
  assignPatient,
  getUsers,
  toggleUser,
  deleteUser
} = require('../controllers/adminController');

// جميع المسارات تتطلب دور المسؤول
router.use(verifyJWT, checkRole('admin'));

// إدارة الأطباء
router.get('/doctors', getDoctors);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);

// إدارة المرضى
router.get('/patients', getPatients);
router.put('/patient/assign', assignPatient);

// إدارة المستخدمين
router.get('/users', getUsers);
router.put('/user/:id', toggleUser);
router.delete('/user/:id', deleteUser);

module.exports = router;
