// Returns all LabReports for the current patient
const LabReport = require('../models/LabReport');

// GET /api/patient/labreports
async function getMyLabReports(req, res) {
  try {
    const labReports = await LabReport.find({ patient: req.user._id })
      .sort({ uploadedAt: -1 });
    res.json(labReports);
  } catch (err) {
    console.error('خطأ في getMyLabReports:', err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
}

module.exports = { getMyLabReports };