const User = require('../models/User');
const DailyRecord = require('../models/DailyRecord');
const Prescription = require('../models/Prescription');
const LabReport = require('../models/LabReport');
const DoctorReview = require('../models/DoctorReview');
const Appointment = require('../models/Appointment');
const MedicationRecord = require('../models/MedicationRecord');
const { logDataDecryption } = require('../utils/auditLogger');

// GET /api/doctor/patient/:id/timeline
async function getPatientTimeline(req, res) {
  try {
    const { id: patientId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    // Verify doctor authorization
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can access patient timeline' });
    }
    
    // Verify patient is assigned to this doctor
    const patient = await User.findById(patientId);
    if (!patient || !patient.assignedDoctor || patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Patient not assigned to this doctor' });
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
      medications
    ] = await Promise.all([
      // Glucose records
      DailyRecord.find({
        patient: patientId,
        ...(Object.keys(dateFilter).length ? { date: dateFilter } : {})
      }).sort({ date: -1 }).limit(parseInt(limit)),
      
      // Prescriptions
      Prescription.find({
        patient: patientId,
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
      }).populate('doctor', 'fullName').sort({ createdAt: -1 }).limit(parseInt(limit)),
      
      // Lab reports
      LabReport.find({
        patient: patientId,
        ...(Object.keys(dateFilter).length ? { uploadedAt: dateFilter } : {})
      }).populate('doctor', 'fullName').sort({ uploadedAt: -1 }).limit(parseInt(limit)),
      
      // Doctor reviews/notes
      DoctorReview.find({
        doctor: req.user.id
      }).populate({
        path: 'record',
        match: { patient: patientId }
      }).sort({ createdAt: -1 }).limit(parseInt(limit)),
      
      // Appointments
      Appointment.find({
        patient: patientId,
        doctor: req.user.id,
        ...(Object.keys(dateFilter).length ? { date: dateFilter } : {})
      }).sort({ date: -1 }).limit(parseInt(limit)),
      
      // Medication records
      MedicationRecord.find({
        patient: patientId,
        ...(Object.keys(dateFilter).length ? { recordedAt: dateFilter } : {})
      }).populate('doctor', 'fullName').sort({ recordedAt: -1 }).limit(parseInt(limit))
    ]);
    
    // Transform data into unified timeline format
    const timeline = [];
    
    // Add glucose records
    glucoseRecords.forEach(record => {
      let status = 'normal';
      let statusColor = '#10b981';
      
      if (record.value >= 300) {
        status = 'critical_high';
        statusColor = '#e11d48';
      } else if (record.value > 180) {
        status = 'high';
        statusColor = '#f97316';
      } else if (record.value < 70) {
        status = 'low';
        statusColor = '#eab308';
      } else if (record.value < 60) {
        status = 'critical_low';
        statusColor = '#e11d48';
      }
      
      timeline.push({
        type: 'glucose',
        id: record._id,
        timestamp: record.date,
        value: record.value,
        status,
        statusColor,
        notes: record.notes,
        icon: '🩸',
        title: `Glucose Reading: ${record.value} mg/dL`,
        description: `Status: ${status.replace('_', ' ').toUpperCase()}`
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
    
    // Add doctor reviews/notes
    doctorReviews.forEach(review => {
      if (review.record) {
        timeline.push({
          type: 'note',
          id: review._id,
          timestamp: review.createdAt,
          text: review.text,
          relatedRecordId: review.record._id,
          icon: '📝',
          title: `Doctor's Note`,
          description: review.text.substring(0, 100) + (review.text.length > 100 ? '...' : ''),
          statusColor: '#3b82f6'
        });
      }
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
    
    // Sort timeline by timestamp (most recent first)
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit results
    const limitedTimeline = timeline.slice(0, parseInt(limit));
    
    // Log data access
    await logDataDecryption(req.user.id, patientId, 'medical_timeline', req);
    
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
        medications: medications.length
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
