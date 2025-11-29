const DailyRecord = require('../models/DailyRecord');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const LabRequest = require('../models/LabRequest');
const InsulinAdjustment = require('../models/InsulinAdjustment');
const MedicalLog = require('../models/MedicalLog');
const Appointment = require('../models/Appointment');
const path = require('path');
const Chat = require('../models/Chat');
const PDFDocument = require('pdfkit');
const { createNotification, listNotifications, markAsRead, markAllAsRead, deleteNotification, unreadCount, NOTIFICATION_TYPES } = require('../utils/notificationService');
const {
  generateAccessToken,
  createSession
} = require('../utils/tokenService');
const { logDataDecryption } = require('../utils/auditLogger');

// Simple i18n for PDF generation
const i18n = {
  tr: {
    'pdf.title': 'Tıbbi Rapor',
    'pdf.patient': 'Hasta Bilgileri',
    'pdf.logs': 'Tıbbi Kayıtlar',
    'pdf.prescriptions': 'Reçeteler',
    'pdf.labs': 'Laboratuvar İstekleri',
    'pdf.glucose': 'Glukoz Geçmişi',
    'pdf.generated': 'Oluşturulma Tarihi',
    'pdf.project': 'Sistem: DİYABETLİYİM'
  },
  en: {
    'pdf.title': 'Medical Report',
    'pdf.patient': 'Patient Information',
    'pdf.logs': 'Medical Logs',
    'pdf.prescriptions': 'Prescriptions',
    'pdf.labs': 'Lab Requests',
    'pdf.glucose': 'Glucose History',
    'pdf.generated': 'Generated on',
    'pdf.project': 'System: DİYABETLİYİM'
  },
  ar: {
    'pdf.title': 'التقرير الطبي',
    'pdf.patient': 'معلومات المريض',
    'pdf.logs': 'السجلات الطبية',
    'pdf.prescriptions': 'الوصفات الطبية',
    'pdf.labs': 'طلبات المختبر',
    'pdf.glucose': 'تاريخ الجلوكوز',
    'pdf.generated': 'تم إنشاؤه في',
    'pdf.project': 'النظام: ديابيتليم'
  }
};

function t(key, lang = 'tr') {
  return (i18n[lang] && i18n[lang][key]) || (i18n['tr'] && i18n['tr'][key]) || key;
}

// GET /api/patient/profile
async function getProfile(req, res) {
  try {
    const patient = await User.findById(req.user.id).select('-passwordHash');
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Log data decryption
    await logDataDecryption(req.user.id, req.user.id, 'patient_data', req);
    
    // Return decrypted data
    res.json(patient.getDecryptedData());
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function sendQuestion(req, res) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Question text required' });
  try {
    req.user.questions.push({ text });
    await req.user.save();
    return res.status(201).json({ message: 'Question sent', question: req.user.questions.slice(-1)[0] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function addRecord(req, res) {
  const { glucose, unit, recordedAt } = req.body;
  if (glucose == null) return res.status(400).json({ message: 'glucose is required' });
  try {
    const reading = await SensorReading.create({ patient: req.user._id, glucose, unit, recordedAt });
    return res.status(201).json({ message: 'record saved', reading });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getMyRecords(req, res) {
  try {
    const readings = await SensorReading.find({ patient: req.user._id }).sort({ recordedAt: -1 });
    return res.json({ readings });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getMyLabRequests(req, res) {
  try {
    const requests = await LabRequest.find({ patient: req.user._id }).sort({ requestedAt: -1 }).populate('doctor', 'fullName');
    return res.json({ requests });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function uploadLabResult(req, res) {
  const { id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'File required' });
  try {
    const request = await LabRequest.findById(id);
    if (!request || request.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    request.resultFile = file.path;
    request.status = 'uploaded';
    request.updatedAt = new Date();
    await request.save();

    // Send notification to doctor
    await createNotification({
      user: request.doctor,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.LAB_RESULT,
      message: `Patient uploaded result for "${request.testName}"`,
      link: `/doctor/lab-review.html?request=${request._id}`,
      meta: { labRequestId: request._id }
    });

    return res.json({ message: 'Result uploaded', request });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getInsulinAdjustments(req, res) {
  try {
    const adjustments = await InsulinAdjustment.find({ patientId: req.user._id }).sort({ createdAt: -1 }).populate('doctorId', 'fullName');
    const current = adjustments.length > 0 ? adjustments[0] : null;
    return res.json({ current, history: adjustments });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getMyPrescriptions(req, res) {
  try {
    const prescriptions = await Prescription.find({ patient: req.user._id }).sort({ createdAt: -1 }).populate('doctor', 'fullName');
    return res.json({ prescriptions });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getPrescriptionPDF(req, res) {
  const { id } = req.params;
  try {
    const prescription = await Prescription.findById(id);
    if (!prescription || prescription.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.sendFile(path.join(__dirname, '..', prescription.pdfUrl));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getChatMessages(req, res) {
  const { withUser } = req.params;
  
  // Check if the withUser is this patient's assigned doctor
  const patient = await User.findById(req.user._id);
  if (!patient || patient.assignedDoctor.toString() !== withUser) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const messages = await Chat.find({
    $or: [
      { senderId: req.user._id, receiverId: withUser },
      { senderId: withUser, receiverId: req.user._id }
    ]
  }).sort({ createdAt: 1 }).populate('senderId', 'fullName').populate('receiverId', 'fullName');

  res.json({ messages });
}

async function sendChatMessage(req, res) {
  const { receiverId, messageText, imageUrl } = req.body;

  // Check if receiverId is this patient's assigned doctor
  const patient = await User.findById(req.user._id);
  if (!patient || patient.assignedDoctor.toString() !== receiverId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!messageText && !imageUrl) {
    return res.status(400).json({ error: 'Message text or image required' });
  }

  const message = await Chat.create({
    senderId: req.user._id,
    receiverId,
    messageText,
    imageUrl
  });

  // Create notification for the receiver
  await Notification.create({
    userId: receiverId,
    type: 'message',
    fromUser: req.user._id,
    message: 'New message from your patient',
    relatedId: message._id
  });

  res.json(message);
}

async function markMessageAsRead(req, res) {
  const { id } = req.params;
  
  const message = await Chat.findById(id);
  if (!message) return res.status(404).json({ error: 'Message not found' });
  
  // Check if the message is for this patient
  if (message.receiverId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  message.read = true;
  await message.save();
  res.json(message);
}

async function getNotifications(req, res) {
  const notifications = await listNotifications(req.user._id, { limit: 50 });
  res.json({ notifications });
}

async function getUnreadCount(req, res) {
  const count = await unreadCount(req.user._id);
  res.json({ count });
}

async function markNotificationAsRead(req, res) {
  const { id } = req.params;
  const notification = await markAsRead(req.user._id, id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  res.json(notification);
}

async function requestPrescriptionRenewal(req, res) {
  const { id } = req.params;

  const prescription = await Prescription.findById(id);
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  // Check if this is the patient's prescription
  if (prescription.patientId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Create notification for the doctor
  await createNotification({
    user: prescription.doctorId,
    sender: req.user._id,
    type: NOTIFICATION_TYPES.COMMENT,
    message: 'Patient requested prescription renewal',
    link: `/doctor/prescriptions-doctor.html?prescription=${prescription._id}`,
    meta: { prescriptionId: prescription._id, action: 'renewal_request' }
  });

  res.json({ message: 'Renewal request sent' });
}

async function getMedicalLogs(req, res) {
  try {
    const logs = await MedicalLog.find({ patientId: req.user._id }).sort({ createdAt: -1 }).populate('doctorId', 'fullName');
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function exportMedicalReport(req, res) {
  const { id } = req.params;
  const lang = req.query.lang || 'tr'; // Default to Turkish

  try {
    // Check access
    const patient = await User.findById(id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const isPatient = req.user.role === 'patient' && req.user._id.toString() === id;
    const isDoctor = req.user.role === 'doctor' && patient.assignedDoctor && patient.assignedDoctor.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch data
    const glucoseReadings = await DailyRecord.find({ patient: id }).sort({ date: -1 }).limit(20);
    const prescriptions = await Prescription.find({ patientId: id }).sort({ createdAt: -1 }).populate('doctorId', 'fullName');
    const labRequests = await LabRequest.find({ patientId: id }).sort({ createdAt: -1 }).populate('doctorId', 'fullName');
    const medicalLogs = await MedicalLog.find({ patientId: id }).sort({ createdAt: 1 }).populate('doctorId', 'fullName');

    // Generate PDF
    const doc = new PDFDocument();
    const filename = `medical-report-${patient.fullName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#20caa8').text(t('pdf.project', lang), { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).fillColor('black').text(t('pdf.title', lang), { align: 'center' });
    doc.moveDown();

    // Patient Info
    doc.fontSize(14).fillColor('#20caa8').text(t('pdf.patient', lang));
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    doc.text(`Name: ${patient.fullName}`);
    doc.text(`Identity Number: ${patient.identityNumber || 'N/A'}`);
    doc.text(`Birth Date: ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'N/A'}`);
    doc.moveDown();

    // Glucose History
    doc.fontSize(14).fillColor('#20caa8').text(t('pdf.glucose', lang));
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    glucoseReadings.forEach(reading => {
      doc.text(`${new Date(reading.date).toLocaleDateString()}: ${reading.value} mg/dL`);
    });
    doc.moveDown();

    // Prescriptions
    doc.fontSize(14).fillColor('#20caa8').text(t('pdf.prescriptions', lang));
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    prescriptions.forEach(pres => {
      doc.text(`${pres.name} - ${pres.dose} - ${pres.frequency} - ${pres.doctorId.fullName}`);
    });
    doc.moveDown();

    // Lab Requests
    doc.fontSize(14).fillColor('#20caa8').text(t('pdf.labs', lang));
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    labRequests.forEach(lab => {
      doc.text(`${lab.testName} - ${new Date(lab.createdAt).toLocaleDateString()} - ${lab.doctorId.fullName}`);
    });
    doc.moveDown();

    // Medical Logs
    doc.fontSize(14).fillColor('#20caa8').text(t('pdf.logs', lang));
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    medicalLogs.forEach(log => {
      doc.text(`${new Date(log.createdAt).toLocaleDateString()}: ${log.type} - ${log.description} (${log.doctorId.fullName})`);
    });
    doc.moveDown();

    // Footer
    doc.fontSize(10).fillColor('gray').text(`${t('pdf.generated', lang)}: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    return res.status(500).json({ message: 'Error generating report' });
  }
}

async function createAppointment(req, res) {
  try {
    const { date, reason } = req.body;
    const patientId = req.user._id;

    // Get patient's assigned doctor
    const patient = await User.findById(patientId);
    if (!patient || !patient.assignedDoctor) {
      return res.status(400).json({ message: 'No assigned doctor found' });
    }

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: patient.assignedDoctor,
      date: new Date(date),
      reason,
      status: 'pending'
    });

    res.status(201).json(appointment);
  } catch (err) {
    console.error('createAppointment error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getMyAppointments(req, res) {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('doctor', 'fullName');
    res.json(appointments);
  } catch (err) {
    console.error('getMyAppointments error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending appointments' });
    }

    await Appointment.findByIdAndDelete(id);
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    console.error('cancelAppointment error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function addDailyRecord(req, res) {
  const { value, date } = req.body;
  if (value == null) return res.status(400).json({ message: 'Glucose value is required' });
  
  try {
    // Create the record
    const record = await DailyRecord.create({
      patient: req.user._id,
      value,
      date: new Date(date),
      unit: 'mg/dL'
    });
    
    // Trigger notification if critical value
    try {
      const patient = await User.findById(req.user.id).select('assignedDoctor fullName');
      if (patient && patient.assignedDoctor) {
        if (record.value >= 300) {
          await createNotification({
            user: patient.assignedDoctor,
            sender: req.user._id,
            type: NOTIFICATION_TYPES.RECORD_HIGH,
            message: `${patient.fullName || 'Patient'} has a critical high glucose level: ${record.value} mg/dL`,
            link: `/doctor/patient-details.html?id=${req.user.id}`,
            meta: { recordId: record._id, value: record.value }
          });
        } else if (record.value <= 60) {
          await createNotification({
            user: patient.assignedDoctor,
            sender: req.user._id,
            type: NOTIFICATION_TYPES.RECORD_LOW,
            message: `${patient.fullName || 'Patient'} has a critical low glucose level: ${record.value} mg/dL`,
            link: `/doctor/patient-details.html?id=${req.user.id}`,
            meta: { recordId: record._id, value: record.value }
          });
        }
      }
    } catch (err) {
      console.error('addDailyRecord notification error:', err.message);
    }
    
    return res.status(201).json({ message: 'Record added', record });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// POST /api/patient/login (DEPRECATED - use /api/auth/login instead)
async function login(req, res) {
  try {
    const { identityNumber, password } = req.body;
    const user = await User.findOne({ identityNumber });
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.role !== 'patient') return res.status(403).json({ error: 'Not a patient' });
    
    let ok = true;
    if (user.passwordHash) {
      ok = await bcrypt.compare(password || '', user.passwordHash);
    }
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Generate tokens using new auth service
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;
    const { refreshToken } = await createSession(user._id, userAgent, ip);
    
    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    res.json({ 
      token: accessToken, // for backward compatibility
      accessToken,
      user: { id: user._id, name: user.fullName, identityNumber: user.identityNumber } 
    });
  } catch (err) {
    console.error('patient login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getProfile, sendQuestion, addRecord, getMyRecords, getMyPrescriptions, getMyLabRequests, uploadLabResult, getInsulinAdjustments, getPrescriptionPDF, getChatMessages, sendChatMessage, markMessageAsRead, getNotifications, getUnreadCount, markNotificationAsRead, requestPrescriptionRenewal, getMedicalLogs, exportMedicalReport, createAppointment, getMyAppointments, cancelAppointment, addDailyRecord, login };
