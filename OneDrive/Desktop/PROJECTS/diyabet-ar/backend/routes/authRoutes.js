const express = require('express');
const router = express.Router();

// استيراد المتحكمات
const { register, login } = require('../controllers/authController');

// تعريف المسارات
router.post('/register', register);
router.post('/login', login);

module.exports = router;

