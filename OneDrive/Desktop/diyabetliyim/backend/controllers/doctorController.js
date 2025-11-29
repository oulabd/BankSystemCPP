const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const DailyRecord = require('../models/DailyRecord');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const LabReport = require('../models/LabReport');
const LabRequest = require('../models/LabRequest');
const InsulinAdjustment = require('../models/InsulinAdjustment');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Chat = require('../models/Chat');
const MedicalLog = require('../models/MedicalLog');
const DoctorReview = require('../models/DoctorReview');
const { createNotification, NOTIFICATION_TYPES, listNotifications, markAsRead, unreadCount } = require('../utils/notificationService');
const {
  generateAccessToken,
  createSession
} = require('../utils/tokenService');
const { logDataDecryption } = require('../utils/auditLogger');

// POST /api/doctor/login (DEPRECATED - use /api/auth/login instead)
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(401).json({ error: 'Invalid' });
    if (user.role !== 'doctor') return res.status(403).json({ error: 'Not a doctor' });
    if (!user.isApproved) return res.status(403).json({ error: 'Account not approved yet' });
    
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
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (err) {
    console.error('doctor login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/doctor/patients
async function listPatients(req, res) {
  const patients = await User.find({ assignedDoctor: req.user.id, role: 'patient' }).select('fullName phone');
  const patientsWithLastRecord = await Promise.all(patients.map(async (patient) => {
    const lastRecord = await DailyRecord.findOne({ patient: patient._id }).sort({ date: -1 });
    let status = 'no_record';
    let lastValue = null;
    if (lastRecord) {
      lastValue = lastRecord.value;
      if (lastRecord.value >= 300) status = 'critical_high';
      else if (lastRecord.value <= 60) status = 'risk_low';
      else status = 'normal';
    }
    return { ...patient.toObject(), lastRecord: lastValue, status };
  }));
  res.json(patientsWithLastRecord);
}

// GET /api/doctor/patient/:id/details
async function getPatientDetails(req, res) {
  const patientId = req.params.id;
  const patient = await User.findById(patientId).select('fullName identityNumber birthDate phone address assignedDoctor');
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Log data decryption
  await logDataDecryption(req.user.id, patientId, 'patient_data', req);
  
  const lastRecord = await DailyRecord.findOne({ patient: patientId }).sort({ date: -1 });
  let lastRecordData = { value: null, status: "none", timestamp: null };
  if (lastRecord) {
    let status = "normal";
    if (lastRecord.value >= 300) status = "critical_high";
    else if (lastRecord.value <= 60) status = "risk_low";
    lastRecordData = { value: lastRecord.value, status, timestamp: lastRecord.date };
  }
  const history = await DailyRecord.find({ patient: patientId }).sort({ date: -1 });
  
  // Return decrypted patient data
  res.json({ 
    patient: patient.getDecryptedData(), 
    lastRecord: lastRecordData, 
    history 
  });
}

// GET /api/doctor/patient/:id/records
async function getPatientRecords(req,res){
  const patientId = req.params.id;
  const records = await DailyRecord.find({ patient: patientId }).sort({ date: -1 }).limit(200);
  res.json(records);
}

// POST /api/doctor/review/:recordId
async function addReview(req,res){
  const { recordId } = req.params;
  const { text } = req.body;
  const review = await DoctorReview.create({ doctor: req.user.id, record: recordId, text });

  try {
    const record = await DailyRecord.findById(recordId).lean();
    const patientId = record && (record.patient || record.patientId);
    if (patientId) {
      await createNotification({
        user: patientId,
        sender: req.user._id,
        type: NOTIFICATION_TYPES.COMMENT,
        message: 'Your doctor left a new comment on your record.',
        link: `/patient/history.html?recordId=${recordId}`,
        meta: { recordId }
      });
    }
  } catch (err) {
    console.error('addReview notification error', err.message);
  }
  res.json(review);
}

// CRUD prescriptions
async function createPrescription(req,res){
  const { patientId, items, notes } = req.body;

  // Check if patient is assigned to this doctor
  const patient = await User.findById(patientId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items required' });
  }

  // Generate unique verify code
  const verifyCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const prescription = await Prescription.create({
    patient: patientId,
    doctor: req.user.id,
    items,
    notes,
    verifyCode
  });

  const doctorName = req.user.fullName || req.user.name || 'Your doctor';
  await createNotification({
    user: patientId,
    sender: req.user._id,
    type: NOTIFICATION_TYPES.PRESCRIPTION_NEW,
    message: `${doctorName} created a new prescription for you.`,
    link: `/patient/prescriptions.html?prescription=${prescription._id}`,
    meta: { prescriptionId: prescription._id }
  });

  res.json(prescription);
}

async function listPrescriptions(req,res){
  const { patientId } = req.query;
  const q = patientId ? { patient: patientId } : { doctor: req.user.id };
  const list = await Prescription.find(q).sort({ createdAt:-1 }).populate('patient', 'fullName').populate('doctor', 'fullName');
  res.json(list);
}

async function getPrescriptionForPatient(req,res){
  const { id } = req.params;
  const prescription = await Prescription.findById(id).populate('patient', 'fullName').populate('doctor', 'fullName');
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  // Check access
  if (req.user.role === 'doctor' && prescription.doctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  } else if (req.user.role === 'patient' && prescription.patient.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(prescription);
}

async function deletePrescription(req, res) {
  const { id } = req.params;
  const prescription = await Prescription.findById(id);
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  // Check if doctor is the creator
  if (prescription.doctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await Prescription.findByIdAndDelete(id);
  res.json({ message: 'Prescription deleted' });
}

// Lab requests
async function createLabRequest(req, res) {
  const { patientId } = req.params;
  const { testName, notes, dueDate } = req.body;

  // Check if patient is assigned to this doctor
  const patient = await User.findById(patientId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!testName) {
    return res.status(400).json({ error: 'Test name required' });
  }

  const labRequest = await LabRequest.create({
    patient: patientId,
    doctor: req.user.id,
    testName,
    doctorComment: notes,
    requestedAt: dueDate ? new Date(dueDate) : new Date()
  });

  const doctorName = req.user.fullName || req.user.name || 'Your doctor';
  await createNotification({
    user: patientId,
    sender: req.user._id,
    type: NOTIFICATION_TYPES.LAB_REQUEST,
    message: `${doctorName} requested a new lab test: ${testName}.`,
    link: `/patient/labs.html?request=${labRequest._id}`,
    meta: { labRequestId: labRequest._id }
  });

  res.json(labRequest);
}

async function getLabRequestsForPatient(req, res) {
  const { patientId } = req.params;
  // Check access
  const patient = await User.findById(patientId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const requests = await LabRequest.find({ patient: patientId }).sort({ requestedAt: -1 });
  res.json(requests);
}

async function listAllLabRequests(req, res) {
  const requests = await LabRequest.find({ doctor: req.user.id })
    .sort({ requestedAt: -1 })
    .populate('patient', 'fullName');
  res.json(requests);
}

async function reviewLabResult(req, res) {
  const { id } = req.params;
  const { doctorComment } = req.body;
  const request = await LabRequest.findById(id);
  if (!request) return res.status(404).json({ error: 'Not found' });
  // Check if doctor is assigned
  const patient = await User.findById(request.patient);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  request.doctorComment = doctorComment;
  request.status = 'reviewed';
  request.updatedAt = new Date();
  await request.save();

  // Send notification to patient
  await createNotification({
    user: request.patient,
    sender: req.user._id,
    type: NOTIFICATION_TYPES.LAB_RESULT,
    message: `Your lab test "${request.testName}" has been reviewed.`,
    link: `/patient/labs.html?request=${request._id}`,
    meta: { labRequestId: request._id }
  });

  res.json(request);
}

async function deleteLabRequest(req, res) {
  const { id } = req.params;
  const request = await LabRequest.findById(id);
  if (!request) return res.status(404).json({ error: 'Not found' });
  // Check if doctor is assigned
  const patient = await User.findById(request.patient);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await LabRequest.findByIdAndDelete(id);
  res.json({ message: 'Lab request deleted' });
}

async function getChatMessages(req, res) {
  const { withUser } = req.params;
  
  // Check if the withUser is one of this doctor's patients
  const patient = await User.findById(withUser);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const messages = await Chat.find({
    $or: [
      { senderId: req.user.id, receiverId: withUser },
      { senderId: withUser, receiverId: req.user.id }
    ]
  }).sort({ createdAt: 1 }).populate('senderId', 'fullName').populate('receiverId', 'fullName');

  res.json({ messages });
}

async function sendChatMessage(req, res) {
  const { receiverId, messageText, imageUrl } = req.body;

  // Check if receiverId is one of this doctor's patients
  const patient = await User.findById(receiverId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!messageText && !imageUrl) {
    return res.status(400).json({ error: 'Message text or image required' });
  }

  const message = await Chat.create({
    senderId: req.user.id,
    receiverId,
    messageText,
    imageUrl
  });

  // Create notification for the receiver
  await createNotification({
    user: receiverId,
    sender: req.user._id,
    type: NOTIFICATION_TYPES.MESSAGE,
    message: 'New message from your doctor.',
    link: `/patient/chat.html?with=${req.user._id}`,
    meta: { chatId: message._id }
  });

  res.json(message);
}

async function markMessageAsRead(req, res) {
  const { id } = req.params;
  
  const message = await Chat.findById(id);
  if (!message) return res.status(404).json({ error: 'Message not found' });
  
  // Check if the message is for this doctor
  if (message.receiverId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  message.read = true;
  await message.save();
  res.json(message);
}

async function getNotifications(req, res) {
  const notifications = await listNotifications(req.user.id || req.user._id, { limit: 50 });
  res.json({ notifications });
}

async function getUnreadCount(req, res) {
  const count = await unreadCount(req.user.id || req.user._id);
  res.json({ count });
}

async function markNotificationAsRead(req, res) {
  const { id } = req.params;
  const notification = await markAsRead(req.user.id || req.user._id, id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  res.json(notification);
}

async function createInsulinAdjustment(req, res) {
  const { patientId, type, dose, notes, reason } = req.body;

  // Check if patient is assigned to this doctor
  const patient = await User.findById(patientId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!type || !dose) {
    return res.status(400).json({ error: 'Type and dose required' });
  }

  const adjustment = await InsulinAdjustment.create({
    patientId,
    doctorId: req.user.id,
    type,
    dose,
    notes,
    reason
  });

  res.json(adjustment);
}

async function getInsulinAdjustmentsForPatient(req, res) {
  const { patientId } = req.params;
  // Check access
  const patient = await User.findById(patientId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const adjustments = await InsulinAdjustment.find({ patientId }).sort({ createdAt: -1 });
  res.json(adjustments);
}

async function updatePrescription(req, res) {
  const { id } = req.params;
  const { items, notes } = req.body;

  const prescription = await Prescription.findById(id);
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  // Check if doctor is the creator
  if (prescription.doctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (items) prescription.items = items;
  if (notes !== undefined) prescription.notes = notes;
  prescription.updatedAt = new Date();

  await prescription.save();
  res.json(prescription);
}

async function generatePrescriptionPDF(req, res) {
  const { id } = req.params;
  const prescription = await Prescription.findById(id).populate('patient', 'fullName').populate('doctor', 'fullName');
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  // Check access
  if (req.user.role === 'doctor' && prescription.doctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  } else if (req.user.role === 'patient' && prescription.patient.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const doc = new PDFDocument();
  const filename = `prescription-${prescription._id}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor('#20caa8').text('DİYABETLİYIM', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).fillColor('black').text('Prescription', { align: 'center' });
  doc.moveDown();

  // Doctor and Patient Info
  doc.fontSize(12);
  doc.text(`Doctor: ${prescription.doctor.fullName}`);
  doc.text(`Patient: ${prescription.patient.fullName}`);
  doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
  doc.moveDown();

  // Items Table
  doc.fontSize(14).text('Medications / Insulin');
  doc.moveDown(0.5);
  prescription.items.forEach(item => {
    doc.fontSize(12).text(`${item.name} - ${item.dose} - ${item.frequency} (${item.type})`);
  });
  doc.moveDown();

  // Notes
  if (prescription.notes) {
    doc.fontSize(14).text('Notes:');
    doc.fontSize(12).text(prescription.notes);
    doc.moveDown();
  }

  // QR Code
  const qrDataURL = await QRCode.toDataURL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-prescription.html?code=${prescription.verifyCode}`);
  // For simplicity, since PDFKit doesn't directly support images from dataURL, we'll add a placeholder
  doc.fontSize(10).text('Scan QR Code to verify:');
  doc.text(prescription.verifyCode); // Placeholder, ideally embed QR image

  doc.end();
}

async function verifyPrescription(req, res) {
  const { code } = req.params;
  const prescription = await Prescription.findOne({ verifyCode: code }).populate('patient', 'fullName').populate('doctor', 'fullName');
  if (!prescription) return res.status(404).json({ error: 'Invalid verification code' });

  res.json({
    valid: true,
    prescription: {
      id: prescription._id,
      doctor: prescription.doctor.fullName,
      patient: prescription.patient.fullName,
      items: prescription.items,
      notes: prescription.notes,
      createdAt: prescription.createdAt
    }
  });
}

async function createMedicalLog(req, res) {
  const { patientId, type, description } = req.body;

  // Check if patient is assigned to this doctor
  const patient = await User.findById(patientId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!type || !description) {
    return res.status(400).json({ error: 'Type and description required' });
  }

  const log = await MedicalLog.create({
    patientId,
    doctorId: req.user.id,
    type,
    description
  });

  res.json(log);
}

async function getMedicalLogs(req, res) {
  const { patientId } = req.params;

  // Check access: doctor can access assigned patients, patient can access own
  if (req.user.role === 'patient') {
    if (patientId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else if (req.user.role === 'doctor') {
    const patient = await User.findById(patientId);
    if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const logs = await MedicalLog.find({ patientId }).sort({ createdAt: -1 }).populate('doctorId', 'fullName');
  res.json(logs);
}

// Appointments: accept/reject
async function respondAppointment(req,res){
  const id = req.params.id;
  const { action } = req.body; // 'accept' or 'reject'
  const ap = await Appointment.findById(id);
  if(!ap) return res.status(404).json({error:'Not found'});
  ap.status = action === 'accept' ? 'approved' : 'rejected';
  await ap.save();
  res.json(ap);
}

async function getDoctorAppointments(req, res) {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .sort({ createdAt: -1 })
      .populate('patient', 'fullName');
    res.json(appointments);
  } catch (err) {
    console.error('getDoctorAppointments error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, messageFromDoctor, newDate } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    appointment.status = status;
    if (messageFromDoctor) appointment.messageFromDoctor = messageFromDoctor;
    if (status === 'rescheduled' && newDate) {
      appointment.date = new Date(newDate);
    }

    await appointment.save();

    // Send notification to patient
    await createNotification({
      user: appointment.patient,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      message: `Your appointment status was updated to ${status}`,
      link: `/patient/appointments.html?id=${appointment._id}`,
      meta: { appointmentId: appointment._id }
    });

    res.json(appointment);
  } catch (err) {
    console.error('updateAppointmentStatus error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  login, listPatients, getPatientDetails, getPatientRecords, addReview,
  createPrescription, listPrescriptions, getPrescriptionForPatient, updatePrescription, deletePrescription, generatePrescriptionPDF, verifyPrescription,
  createLabRequest, getLabRequestsForPatient, listAllLabRequests, reviewLabResult, deleteLabRequest,
  createInsulinAdjustment, getInsulinAdjustmentsForPatient,
  getChatMessages, sendChatMessage, markMessageAsRead,
  getNotifications, getUnreadCount, markNotificationAsRead,
  createMedicalLog, getMedicalLogs,
  respondAppointment, getDoctorAppointments, updateAppointmentStatus
};

