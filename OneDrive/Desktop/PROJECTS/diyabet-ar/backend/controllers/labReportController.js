const LabReport = require('../models/LabReport');
const path = require('path');

// POST /api/patient/labs/upload
async function uploadLabReport(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'الملف مطلوب' });
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: 'نوع الاختبار مطلوب' });
    const newReport = new LabReport({
      patient: req.user._id,
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      originalFileType: req.file.mimetype,
      type,
      status: 'pending',
      uploadedAt: new Date()
    });
    await newReport.save();
    res.json({ message: 'تم رفع تقرير المختبر', report: newReport });
  } catch (err) {
    console.error('خطأ في uploadLabReport:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء الرفع' });
  }
}

module.exports = { uploadLabReport };
