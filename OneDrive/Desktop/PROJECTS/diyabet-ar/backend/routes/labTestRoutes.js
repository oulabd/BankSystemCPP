const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();
const labTestController = require('../controllers/labTestController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'labs');
fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}_${safe}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type. Only PDF, JPG and PNG are allowed.'), false);
}

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });

// Serve uploads via static in server.js: app.use('/uploads', express.static('uploads'))

// All lab routes require auth
router.use(authMiddleware);

// POST /api/labs/ - create lab test (doctor, admin)
router.post('/', roleMiddleware(['doctor', 'admin']), labTestController.createLabTest);

// POST /api/labs/:id/upload - upload file for lab test (doctor, admin)
router.post('/:id/upload', roleMiddleware(['doctor', 'admin']), upload.single('file'), labTestController.uploadLabFile);

// GET /api/labs/me - patient gets own lab tests
router.get('/me', roleMiddleware('patient'), labTestController.getMyLabTests);

// GET /api/labs/patient/:patientId - doctor/admin views patient tests
router.get('/patient/:patientId', roleMiddleware(['doctor', 'admin']), labTestController.getPatientLabTests);

// GET /api/labs/:id - get single lab test (with ownership checks inside controller)
router.get('/:id', roleMiddleware(['patient', 'doctor', 'admin']), labTestController.getLabTestDetail);

// PUT /api/labs/:id - update lab test (doctor/admin)
router.put('/:id', roleMiddleware(['doctor', 'admin']), upload.single('file'), labTestController.updateLabTest);

// DELETE /api/labs/:id - admin only
router.delete('/:id', roleMiddleware('admin'), labTestController.deleteLabTest);

module.exports = router;
