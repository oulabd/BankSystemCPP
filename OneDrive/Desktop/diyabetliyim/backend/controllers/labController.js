const LabReport = require('../models/LabReport');
const User = require('../models/User');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationService');
const fs = require('fs');
const path = require('path');
const { decryptFile } = require('../utils/encryption');
const { logFileAccess, logAccessDenied } = require('../utils/auditLogger');

// POST /api/labs/upload
async function uploadLabReport(req, res) {
  try {
    const { type, patientId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Lab file is required' });
    }
    
    if (!type) {
      return res.status(400).json({ error: 'Lab type is required' });
    }
    
    // Determine if upload is by patient or doctor
    let actualPatientId = patientId;
    let doctorId = null;
    
    if (req.user.role === 'patient') {
      actualPatientId = req.user.id;
      const patient = await User.findById(actualPatientId);
      doctorId = patient.assignedDoctor;
    } else if (req.user.role === 'doctor') {
      if (!patientId) {
        return res.status(400).json({ error: 'Patient ID required' });
      }
      
      // Verify patient is assigned to this doctor
      const patient = await User.findById(patientId);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      actualPatientId = patientId;
      doctorId = req.user.id;
    }
    
    // Create lab report with encrypted file
    const labReport = await LabReport.create({
      patient: actualPatientId,
      doctor: doctorId,
      fileUrl: `/uploads/labs/${req.file.encryptedFilename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.originalMimeType,
      originalFileType: req.file.originalMimeType,
      isEncrypted: true,
      type,
      status: 'pending'
    });
    
    await labReport.populate('patient', 'fullName');
    await labReport.populate('doctor', 'fullName');
    
    // Log upload event
    await logFileAccess(
      req.user.id,
      labReport._id,
      'upload',
      req,
      'success',
      `Uploaded encrypted ${type} lab report`
    );
    
    // Send notification to doctor if patient uploaded
    if (req.user.role === 'patient' && doctorId) {
      await createNotification({
        user: doctorId,
        sender: req.user._id,
        type: NOTIFICATION_TYPES.LAB_RESULT,
        message: `${labReport.patient.fullName} uploaded a new ${type} lab report.`,
        link: `/doctor/labs.html?patientId=${actualPatientId}`,
        meta: { labReportId: labReport._id }
      });
    }
    
    res.json(labReport);
  } catch (err) {
    console.error('uploadLabReport error:', err);
    
    // Clean up encrypted file on error
    if (req.file && req.file.encryptedPath && fs.existsSync(req.file.encryptedPath)) {
      fs.unlinkSync(req.file.encryptedPath);
    }
    
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/labs/file/:id - Secure file download with decryption
async function getLabReportFile(req, res) {
  try {
    const { id } = req.params;
    
    const labReport = await LabReport.findById(id).populate('patient', 'fullName assignedDoctor');
    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }
    
    // Verify access authorization
    let authorized = false;
    
    if (req.user.role === 'patient' && labReport.patient._id.toString() === req.user.id) {
      authorized = true;
    } else if (req.user.role === 'doctor') {
      const patient = await User.findById(labReport.patient._id);
      if (patient && patient.assignedDoctor && patient.assignedDoctor.toString() === req.user.id) {
        authorized = true;
      }
    }
    
    if (!authorized) {
      await logAccessDenied(
        req.user.id,
        labReport._id,
        'lab_report',
        req,
        'User not authorized to access this lab report'
      );
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Read encrypted file
    const filePath = path.join(__dirname, '..', labReport.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const encryptedBuffer = fs.readFileSync(filePath);
    
    // Decrypt file
    const decryptedBuffer = decryptFile(encryptedBuffer);
    
    // Log successful access
    await logFileAccess(
      req.user.id,
      labReport._id,
      'download',
      req,
      'success',
      `Downloaded and decrypted ${labReport.type} lab report`
    );
    
    // Set appropriate headers
    res.setHeader('Content-Type', labReport.originalFileType || labReport.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${labReport.fileName}"`);
    res.setHeader('Content-Length', decryptedBuffer.length);
    
    res.send(decryptedBuffer);
  } catch (err) {
    console.error('getLabReportFile error:', err);
    
    await logFileAccess(
      req.user.id,
      req.params.id,
      'download',
      req,
      'failure',
      `Failed to download lab report: ${err.message}`
    );
    
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/labs/mine
async function getMyLabReports(req, res) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can access this endpoint' });
    }
    
    const labReports = await LabReport.find({ patient: req.user.id })
      .sort({ uploadedAt: -1 })
      .populate('doctor', 'fullName');
    
    res.json({ labReports });
  } catch (err) {
    console.error('getMyLabReports error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/labs/patient/:id
async function getPatientLabReports(req, res) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can access this endpoint' });
    }
    
    const { id } = req.params;
    
    // Verify patient is assigned to this doctor
    const patient = await User.findById(id);
    if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const labReports = await LabReport.find({ patient: id })
      .sort({ uploadedAt: -1 })
      .populate('patient', 'fullName')
      .populate('doctor', 'fullName');
    
    res.json({ labReports });
  } catch (err) {
    console.error('getPatientLabReports error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// PUT /api/labs/:id/review
async function reviewLabReport(req, res) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can review lab reports' });
    }
    
    const { id } = req.params;
    const { status, doctorComment } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const labReport = await LabReport.findById(id).populate('patient', 'fullName');
    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }
    
    // Verify patient is assigned to this doctor
    const patient = await User.findById(labReport.patient._id);
    if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Update lab report
    labReport.status = status;
    if (doctorComment) labReport.doctorComment = doctorComment;
    labReport.doctor = req.user.id;
    labReport.reviewedAt = new Date();
    
    await labReport.save();
    await labReport.populate('doctor', 'fullName');
    
    // Send notification to patient
    const statusMessages = {
      reviewed: 'reviewed your lab report',
      retest: 'requested a retest for your lab report',
      needs_followup: 'marked your lab report as needing follow-up'
    };
    
    const message = statusMessages[status] || 'updated your lab report';
    
    await createNotification({
      user: labReport.patient._id,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.LAB_RESULT,
      message: `Your doctor ${message}: ${labReport.type}`,
      link: `/patient/labs.html?reportId=${labReport._id}`,
      meta: { labReportId: labReport._id }
    });
    
    res.json(labReport);
  } catch (err) {
    console.error('reviewLabReport error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// DELETE /api/labs/:id
async function deleteLabReport(req, res) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can delete lab reports' });
    }
    
    const { id } = req.params;
    
    const labReport = await LabReport.findById(id);
    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }
    
    // Verify patient is assigned to this doctor
    const patient = await User.findById(labReport.patient);
    if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', labReport.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await LabReport.findByIdAndDelete(id);
    
    res.json({ message: 'Lab report deleted successfully' });
  } catch (err) {
    console.error('deleteLabReport error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/labs/:id
async function getLabReport(req, res) {
  try {
    const { id } = req.params;
    
    const labReport = await LabReport.findById(id)
      .populate('patient', 'fullName')
      .populate('doctor', 'fullName');
    
    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }
    
    // Verify access
    if (req.user.role === 'patient' && labReport.patient._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (req.user.role === 'doctor') {
      const patient = await User.findById(labReport.patient._id);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    
    res.json(labReport);
  } catch (err) {
    console.error('getLabReport error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  uploadLabReport,
  getMyLabReports,
  getPatientLabReports,
  reviewLabReport,
  deleteLabReport,
  getLabReport,
  getLabReportFile
};
