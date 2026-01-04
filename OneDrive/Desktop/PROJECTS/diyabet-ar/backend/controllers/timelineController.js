const User = require('../models/User');
const DailyRecord = require('../models/DailyRecord');
const Prescription = require('../models/Prescription');
const LabReport = require('../models/LabReport');
const DoctorReview = require('../models/DoctorReview');
const Appointment = require('../models/Appointment');
const MedicationRecord = require('../models/MedicationRecord');
const InsulinAdjustment = require('../models/InsulinAdjustment');
const { logDataDecryption } = require('../utils/auditLogger');
const { decryptText } = require('../utils/encryption');

// GET /api/doctor/patient/:id/timeline
async function getPatientTimeline(req, res) {
  try {
    const { id: patientId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    // Authorization: allow doctor for their patient, or patient for self
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (req.user.role === 'doctor') {
      // Doctor can only access their own patients
      if (!patient.assignedDoctor || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Patient not assigned to this doctor' });
      }
    } else if (req.user.role === 'patient') {
      // Patient can only access their own timeline
      if (patient._id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Fetch all medical data in parallel
    const [
      glucoseRecords,
      prescriptions,
      labReports,
      doctorReviews,
      appointments,
      medications,
      insulinAdjustments,
      patientWithInstructions
    ] = await Promise.all([
      // Glucose records
      DailyRecord.find({
        patientId: patientId,
        ...(Object.keys(dateFilter).length ? { day: dateFilter } : {})
      }).sort({ day: -1 }).limit(parseInt(limit)),
      
      // Prescriptions
      Prescription.find({
  patientId: patientId,
  ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
})
.populate('doctorId', 'fullName')
.sort({ createdAt: -1 })
.limit(parseInt(limit)),

      // Lab reports
      LabReport.find({
        patient: patientId,
        ...(Object.keys(dateFilter).length ? { uploadedAt: dateFilter } : {})
      }).populate('doctor', 'fullName').sort({ uploadedAt: -1 }).limit(parseInt(limit)),
      
      // Doctor reviews/notes
      (() => {
        let doctorReviewQuery = {};
        if (req.user.role === 'doctor') {
          doctorReviewQuery = { doctor: req.user.id };
        }
        return DoctorReview.find(doctorReviewQuery).populate({
          path: 'record',
          match: { patientId: patientId }
        }).sort({ createdAt: -1 }).limit(parseInt(limit));
      })(),
      
      // Appointments
     Appointment.find({
  patientId: patientId,
  ...(Object.keys(dateFilter).length ? { date: dateFilter } : {})
})
.populate('doctorId', 'fullName')
.sort({ date: -1 })
.limit(parseInt(limit)),

      // Medication records
      MedicationRecord.find({
        patient: patientId,
        ...(Object.keys(dateFilter).length ? { recordedAt: dateFilter } : {})
      }).populate('doctor', 'fullName').sort({ recordedAt: -1 }).limit(parseInt(limit)),
      
      // Insulin adjustments
      InsulinAdjustment.find({ patientId }).populate('doctorId', 'fullName').sort({ createdAt: -1 }), // keep as is, schema is correct
      
      // Patient instructions
      User.findById(patientId).select('instructions').populate('instructions.doctor', 'fullName')
    ]);
    
    // Transform data into unified timeline format
    const timeline = [];
    
    // Add glucose records
    // Add glucose records
glucoseRecords.forEach(record => {


let decryptedNotes = '';
if (record.notes && typeof record.notes === 'string' && record.notes.includes(':')) {
  try {
    decryptedNotes = decryptText(record.notes);
    if (decryptedNotes === null || decryptedNotes === undefined || decryptedNotes === '') {
      decryptedNotes = '[Not decrypted]';
    }
    console.log('Decrypted notes for record', record._id, ':', decryptedNotes);
  } catch (e) {
    decryptedNotes = '[Decryption failed]';
    console.error('Decryption failed for record', record._id, ':', e);
  }
} else {
  decryptedNotes = record.notes || '';
}

  timeline.push({
    type: 'glucose',
    id: record._id,
    timestamp: record.day || record.date,
    day: record.day ? new Date(record.day).toLocaleDateString('tr-TR') : '',
    fastingBS: record.fasting ?? record.fastingBS ?? '',
    beforeBreakfastBS: record.beforeBreakfast ?? '',
    afterBreakfastBS: record.afterBreakfast ?? '',
    beforeLunchBS: record.beforeLunch ?? '',
    afterLunchBS: record.afterLunch ?? '',
    beforeDinnerBS: record.beforeDinner ?? '',
    afterDinnerBS: record.afterDinner ?? '',
    notes: decryptedNotes
  });
});

    
    // Add prescriptions
    prescriptions.forEach(prescription => {
      timeline.push({
        type: 'prescription',
        id: prescription._id,
        timestamp: prescription.createdAt,
        items: prescription.items,
        notes: prescription.notes,
        doctorName: prescription.doctor?.fullName || 'Unknown',
        icon: '💊',
        title: `Prescription Created`,
        description: `${prescription.items.length} medication(s) prescribed`,
        statusColor: '#8b5cf6'
      });
    });
    
    // Add lab reports
    labReports.forEach(lab => {
      let statusColor = '#6b7280';
      if (lab.status === 'reviewed') statusColor = '#10b981';
      if (lab.status === 'retest') statusColor = '#f97316';
      if (lab.status === 'needs_followup') statusColor = '#e11d48';
      
      timeline.push({
        type: 'lab',
        id: lab._id,
        timestamp: lab.uploadedAt,
        labType: lab.type,
        status: lab.status,
        statusColor,
        fileName: lab.fileName,
        fileUrl: `/api/labs/file/${lab._id}`,
        doctorComment: lab.doctorComment,
        reviewedAt: lab.reviewedAt,
        icon: '🔬',
        title: `Lab Report: ${lab.type}`,
        description: `Status: ${lab.status.replace('_', ' ').toUpperCase()}`
      });
    });
    
    // Add doctor reviews/notes (linked to daily records)
    doctorReviews
      .filter(review => review.record && review.record.patientId && review.record.patientId.toString() === patientId)
      .forEach(review => {
        let day = '';
        if (review.record && review.record.day) {
          day = new Date(review.record.day).toLocaleDateString('tr-TR');
        } else if (review.createdAt) {
          day = new Date(review.createdAt).toLocaleDateString('tr-TR');
        }
        timeline.push({
          type: 'note',
          id: review._id,
          timestamp: review.createdAt,
          text: review.text,
          relatedRecordId: review.record ? review.record._id : undefined,
          day,
          icon: '📝',
          title: `Doctor's Note`,
          description: review.text.substring(0, 100) + (review.text.length > 100 ? '...' : ''),
          statusColor: '#3b82f6'
        });
      });

    // Add MedicalLog notes of type 'note' or 'comment' for this patient
    const MedicalLog = require('../models/MedicalLog');
    const medicalLogs = await MedicalLog.find({ patientId, type: { $in: ['note', 'comment'] } }).sort({ createdAt: -1 });
    medicalLogs.forEach(log => {
      let day = log.createdAt ? new Date(log.createdAt).toLocaleDateString('tr-TR') : '';
      timeline.push({
        type: 'note',
        id: log._id,
        timestamp: log.createdAt,
        text: log.description,
        day,
        icon: '📝',
        title: `Doctor's Note`,
        description: log.description.substring(0, 100) + (log.description.length > 100 ? '...' : ''),
        statusColor: '#3b82f6'
      });
    });
    
    // Add appointments
    appointments.forEach(appointment => {
      let statusColor = '#6b7280';
      if (appointment.status === 'approved') statusColor = '#10b981';
      if (appointment.status === 'rejected') statusColor = '#e11d48';
      if (appointment.status === 'pending') statusColor = '#eab308';
      
      timeline.push({
        type: 'appointment',
        id: appointment._id,
        timestamp: appointment.date,
        status: appointment.status,
        statusColor,
        reason: appointment.reason,
        message: appointment.messageFromDoctor,
        icon: '📅',
        title: `Appointment: ${appointment.status.toUpperCase()}`,
        description: appointment.reason || 'No reason provided'
      });
    });
    
    // Add medication records
    medications.forEach(med => {
      timeline.push({
        type: 'medication',
        id: med._id,
        timestamp: med.recordedAt,
        medicationType: med.medicationType,
        name: med.name,
        dose: med.dose,
        unit: med.unit,
        timing: med.timing,
        notes: med.notes,
        isRecommendation: med.isRecommendation,
        icon: med.medicationType === 'insulin' ? '💉' : '💊',
        title: `${med.medicationType === 'insulin' ? 'Insulin' : 'Medication'}: ${med.name}`,
        description: `${med.dose} ${med.unit} - ${med.timing.replace('_', ' ')}`,
        statusColor: med.medicationType === 'insulin' ? '#3b82f6' : '#8b5cf6'
      });
    });
    
    // Add insulin adjustments
    insulinAdjustments.forEach(adj => {
      timeline.push({
        type: 'insulin_adjustment',
        id: adj._id,
        timestamp: adj.createdAt,
        doctorName: adj.doctorId?.fullName || 'Unknown',
        adjustment: adj.adjustment,
        reason: adj.reason,
        notes: adj.notes,
        icon: '⚙️',
        title: `Insulin Adjustment`,
        description: `Adjusted by ${adj.doctorId?.fullName || 'Unknown'}: ${adj.adjustment}`,
        statusColor: '#4ade80'
      });
    });
    
    // Add patient instructions
    if (patientWithInstructions && patientWithInstructions.instructions) {
      patientWithInstructions.instructions.forEach(instr => {
        timeline.push({
          type: 'instruction',
          id: instr._id,
          timestamp: instr.createdAt,
          text: instr.text,
          doctorName: instr.doctor?.fullName || 'Unknown',
          icon: '📋',
          title: `Instruction from ${instr.doctor?.fullName || 'Unknown'}`,
          description: instr.text.substring(0, 100) + (instr.text.length > 100 ? '...' : ''),
          statusColor: '#3b82f6'
        });
      });
    }
    
    // Sort timeline by timestamp (most recent first)
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit results
    const limitedTimeline = timeline.slice(0, parseInt(limit));
    
    // Log data access
    await logDataDecryption(req.user.id, patientId, 'patient_data', req);
    
    res.json({
      patient: {
        id: patient._id,
        name: patient.fullName,
        identityNumber: patient.getDecryptedData().identityNumber
      },
      timeline: limitedTimeline,
      totalEvents: timeline.length,
      summary: {
        glucoseRecords: glucoseRecords.length,
        prescriptions: prescriptions.length,
        labReports: labReports.length,
        doctorNotes: doctorReviews.filter(r => r.record).length,
        appointments: appointments.length,
        medications: medications.length,
        insulinAdjustments: insulinAdjustments.length,
        instructions: patientWithInstructions?.instructions.length || 0
      }
    });
  } catch (err) {
    console.error('getPatientTimeline error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getPatientTimeline
};
