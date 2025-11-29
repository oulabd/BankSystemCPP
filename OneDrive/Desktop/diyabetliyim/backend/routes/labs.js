const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { uploadLab, encryptUploadedFile } = require('../middleware/uploadLab');
const {
  uploadLabReport,
  getMyLabReports,
  getPatientLabReports,
  reviewLabReport,
  deleteLabReport,
  getLabReport,
  getLabReportFile
} = require('../controllers/labController');

// All routes require authentication
router.use(authMiddleware);

router.post('/upload', uploadLab.single('file'), encryptUploadedFile, uploadLabReport);
router.get('/mine', getMyLabReports);
router.get('/patient/:id', getPatientLabReports);
router.get('/file/:id', getLabReportFile); // Secure file download
router.get('/:id', getLabReport);
router.put('/:id/review', reviewLabReport);
router.delete('/:id', deleteLabReport);

module.exports = router;
