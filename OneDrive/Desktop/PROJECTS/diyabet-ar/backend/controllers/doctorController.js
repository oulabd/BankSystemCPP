// DELETE /api/doctor/patient/:id/instructions/:instructionId
async function deletePatientInstruction(req, res) {
  const { id, instructionId } = req.params;
  try {
    console.log('[DELETE INSTRUCTION] Patient ID:', id, 'Instruction ID:', instructionId);
    const patient = await User.findById(id);
    if (!patient) {
      console.log('[DELETE INSTRUCTION] Patient not found');
      return res.status(404).json({ error: 'Patient not found' });
    }
    console.log('[DELETE INSTRUCTION] Patient found:', patient._id);
    const instruction = patient.instructions.id(instructionId);
    if (!instruction) {
      console.log('[DELETE INSTRUCTION] Instruction not found in patient:', instructionId);
      return res.status(404).json({ error: 'Instruction not found' });
    }
    console.log('[DELETE INSTRUCTION] Instruction found:', instruction);
    instruction.remove();
    await patient.save();
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE INSTRUCTION] Error:', err);
    res.status(500).json({ error: 'Failed to delete instruction' });
  }
}
// PUT /api/doctor/patient/:id/identity
const { encryptText } = require('../utils/encryption');
async function updatePatientIdentityNumber(req, res) {
  try {
    const patientId = req.params.id;
    const { identityNumber } = req.body;
    if (!identityNumber) return res.status(400).json({ error: 'رقم الهوية مطلوب' });
    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    patient.identityNumber = encryptText(identityNumber);
    await patient.save();
    res.json({ success: true, identityNumber });
  } catch (err) {
    console.error('updatePatientIdentityNumber error:', err);
    res.status(500).json({ error: 'تعذر تحديث رقم الهوية' });
  }
}
// PATCH /api/doctor/patient/:id/instructions/:instructionId
async function updatePatientInstruction(req, res) {
  const { id, instructionId } = req.params;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Instruction text required' });
  try {
    const patient = await User.findById(id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    const instruction = patient.instructions.id(instructionId);
    if (!instruction) return res.status(404).json({ error: 'Instruction not found' });
    instruction.text = text;
    instruction.date = new Date();
    await patient.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update instruction' });
  }
}
// GET /api/doctor/patient/:id/instructions
async function getPatientInstructions(req, res) {
  const { id } = req.params;
  try {
    const patient = await User.findById(id).populate('instructions.doctor', 'fullName');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient.instructions || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch instructions' });
  }
}
// GET /api/doctor/lab-reports/:patientId
async function getLabReportsForPatient(req, res) {
  const { patientId } = req.params;
  try {
    // Allow any doctor to view lab reports for any patient
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const reports = await LabReport.find({ patient: patientId }).sort({ uploadedAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('getLabReportsForPatient error', err);
    res.status(500).json({ error: 'Server error' });
  }
}
// Add instruction/comment for a patient
async function addPatientInstruction(req, res) {
  const { id } = req.params;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Instruction text required' });
  try {
    // Store instruction in patient document (or create a new model if needed)
    const patient = await User.findById(id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (!patient.instructions) patient.instructions = [];
    patient.instructions.push({ text, doctor: req.user.id, date: new Date() });
    await patient.save();
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save instruction' });
  }
}
// ...all function definitions remain above...

const getPatientNotes = require('./getPatientNotes');
module.exports = {
  addPatientInstruction,
  getPatientInstructions,
  updatePatientInstruction,
  deletePatientInstruction,
  login,
  listPatients,
  getPatientDetails,
  getPatientRecords,
  addReview,
  createPrescription,
  listPrescriptions,
  getPrescriptionForPatient,
  deletePrescription,
  createLabRequest,
  getLabRequestsForPatient,
  listAllLabRequests,
  reviewLabResult,
  deleteLabRequest,
  getChatMessages,
  sendChatMessage,
  markMessageAsRead,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  updatePrescription,
  generatePrescriptionPDF,
  verifyPrescription,
  createMedicalLog,
  getMedicalLogs,
  respondAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
  addDoctorNote,
  createDoctorPrescription,
  requestLabTest,
  updatePatientIdentityNumber,
  validateDoctorPatientRelationship,
  getLabReportsForPatient,
  getPatientNotes
};
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
const util = require('util');
const Chat = require('../models/Chat');
const MedicalLog = require('../models/MedicalLog');
const DoctorReview = require('../models/DoctorReview');
const {
  generateAccessToken,
  createSession
} = require('../utils/tokenService');
const { logDataDecryption, createNotification, NOTIFICATION_TYPES } = require('../utils/auditLogger');

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
  const patients = await User.find({ assignedDoctor: req.user.id, role: 'patient' });
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
    const decrypted = patient.getDecryptedData();
    return { ...decrypted, lastRecord: lastValue, status };
  }));
  res.json(patientsWithLastRecord);
}

// GET /api/doctor/patient/:id/details
async function getPatientDetails(req, res) {
  try {
    const patientId = req.params.id;
    const patient = await User.findById(patientId).select('fullName identityNumber birthDate phone address assignedDoctor');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Allow all doctors to view patient details (remove assignedDoctor check)
    
    // Log data decryption
    await logDataDecryption(req.user.id, patientId, 'patient_data', req);
    
    const lastRecord = await DailyRecord.findOne({ patientId }).sort({ createdAt: -1 });
    let lastRecordData = { value: null, status: "none", timestamp: null };
    if (lastRecord) {
      // Calculate average glucose from available readings
      const values = [
        lastRecord.fasting,
        lastRecord.beforeBreakfast,
        lastRecord.afterBreakfast,
        lastRecord.beforeLunch,
        lastRecord.afterLunch,
        lastRecord.beforeDinner,
        lastRecord.afterDinner,
        lastRecord.snack1,
        lastRecord.snack2,
        lastRecord.snack3,
        lastRecord.measurement_12am,
        lastRecord.measurement_3am
      ].filter(v => v !== null && v !== undefined);
      
      if (values.length > 0) {
        const avgValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        let status = "normal";
        if (avgValue >= 300) status = "critical_high";
        else if (avgValue <= 60) status = "risk_low";
        lastRecordData = { value: avgValue, status, timestamp: lastRecord.createdAt };
      }
    }
    const history = await DailyRecord.find({ patientId }).sort({ createdAt: -1 }).limit(30);
    
    // Return decrypted patient data
    res.json({ 
      patient: patient.getDecryptedData(), 
      lastRecord: lastRecordData, 
      history 
    });
  } catch (err) {
    console.error('getPatientDetails error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
}

// GET /api/doctor/patient/:id/records
async function getPatientRecords(req,res){
  const patientId = req.params.id;
  const records = await DailyRecord.find({ patientId }).sort({ createdAt: -1 }).limit(200);
  res.json(records);
}

// POST /api/doctor/review/:recordId
async function addReview(req,res){
  const { recordId } = req.params;
  const { text } = req.body;
  const review = await DoctorReview.create({ doctor: req.user.id, record: recordId, text });
  res.json(review);
}

// CRUD prescriptions
async function createPrescription(req,res){
  console.log('=== CREATE PRESCRIPTION ===');
  console.log('req.body:', JSON.stringify(req.body, null, 2));
let { patientId, items, notes } = req.body;

if (typeof items === 'string') {
  items = JSON.parse(items);
}
  console.log('typeof items:', typeof items, 'items:', items);

  // Check if patient is assigned to this doctor
  const patient = await User.findById(patientId);
  if (!patient || !patient.assignedDoctor || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Ensure items is an array and all elements are objects
  let normalizedItems = items;
  console.log('Before normalization, items:', items, 'typeof:', typeof items);
  // If items is a string, try to parse it
  if (typeof normalizedItems === 'string') {
    try {
      normalizedItems = JSON.parse(normalizedItems);
      console.log('Parsed normalizedItems:', normalizedItems);
    } catch (e) {
      console.error('Failed to parse items string:', normalizedItems);
      return res.status(400).json({ error: 'Items must be a valid JSON array' });
    }
  }
  // Validate items is an array
  console.log('After normalization, normalizedItems:', normalizedItems, 'typeof:', typeof normalizedItems);
  if (!Array.isArray(normalizedItems)) {
    console.error('normalizedItems is not an array:', normalizedItems);
    return res.status(400).json({ error: 'Items must be an array' });
  }
  // If the client sent the whole array as a single string element (e.g. ["..."]), try to parse it
  if (normalizedItems.length === 1 && typeof normalizedItems[0] === 'string') {
    const str = normalizedItems[0].trim();
    if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          normalizedItems = parsed;
          console.log('Parsed single-string items into array', normalizedItems);
        }
      } catch (e) {
        // try forgiving single-quote style
        try {
          const fixed = str.replace(/'/g, '"');
          const parsed2 = JSON.parse(fixed);
          if (Array.isArray(parsed2)) {
            normalizedItems = parsed2;
            console.log('Parsed single-string items (fixed quotes) into array', normalizedItems);
          }
        } catch (e2) {
          // leave as-is; later validation will fail with clear error
        }
      }
    }
  }
  if (normalizedItems.length === 0) {
    console.error('normalizedItems is empty array');
    return res.status(400).json({ error: 'Items required' });
  }
  // Check each item: if string, try to parse; if not object, reject
  normalizedItems = normalizedItems.map((item, idx) => {
    console.log(`Item[${idx}] type:`, typeof item, 'value:', item);
    if (typeof item === 'string') {
      try {
        const parsed = JSON.parse(item);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
        throw new Error();
      } catch {
        console.error(`Item at index ${idx} is a string but not a valid object:`, item);
        throw new Error(`Item at index ${idx} is a string but not a valid object`);
      }
    }
    if (typeof item !== 'object' || item === null) {
      console.error(`Item at index ${idx} is not an object:`, item);
      throw new Error(`Item at index ${idx} must be an object`);
    }
    return item;
  });
  // Final defensive coercion: ensure each item is a plain POJO with string fields
  normalizedItems = normalizedItems.map((it, idx) => {
    if (typeof it === 'string') {
      // try forgiving parse: replace single quotes with double quotes
      try {
        return JSON.parse(it);
      } catch (e) {
        try {
          const fixed = it.replace(/'/g, '"');
          return JSON.parse(fixed);
        } catch (e2) {
          throw new Error(`Item[${idx}] could not be parsed`);
        }
      }
    }
    // make a shallow clone to strip prototypes
    return Object.assign({}, it);
  });
  // Use first item to fill summary fields expected by UI
  const primary = normalizedItems[0];
  // Defensive: catch mapping errors
  try {
    normalizedItems = normalizedItems;
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    console.log('Final normalizedItems details:', {
      isArray: Array.isArray(normalizedItems),
      length: normalizedItems.length,
      firstType: typeof normalizedItems[0],
      firstCtor: normalizedItems[0] && normalizedItems[0].constructor ? normalizedItems[0].constructor.name : null,
      firstKeys: normalizedItems[0] && Object.keys(normalizedItems[0])
    });
    console.log('NormalizedItems dump:', util.inspect(normalizedItems, { depth: 4 }));
    // Create a new Prescription document with items set in constructor
    // Generate a unique verificationCode and verifyCode (8 chars)
    function generateCode(length = 8) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    let verificationCode, verifyCode;
    let isUniqueVerification = false, isUniqueVerify = false;
    // Generate unique verificationCode
    while (!isUniqueVerification) {
      verificationCode = generateCode(8);
      // eslint-disable-next-line no-await-in-loop
      const exists = await Prescription.findOne({ verificationCode });
      if (!exists) isUniqueVerification = true;
    }
    // Generate unique verifyCode
    while (!isUniqueVerify) {
      verifyCode = generateCode(8);
      // eslint-disable-next-line no-await-in-loop
      const exists = await Prescription.findOne({ verifyCode });
      if (!exists) isUniqueVerify = true;
    }

    const prescription = new Prescription({
      patientId,
      doctorId: req.user.id,
      notes: notes || '',
      type: primary.type || 'medication',
      name: primary.name || 'Prescription',
      dose: primary.dose || '',
      frequency: primary.frequency || '',
      duration: primary.duration || '',
      items: normalizedItems,
      verificationCode,
      verifyCode
    });
    await prescription.save();

    console.log('Prescription created:', prescription._id);
    return res.status(201).json(prescription);
  } catch (err) {
    console.error('Prescription creation error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function listPrescriptions(req,res){
  const { id } = req.params;
  const q = id ? { patientId: id } : { doctorId: req.user.id };
  const list = await Prescription.find(q)
    .sort({ createdAt: -1 })
    .populate('patientId', 'fullName')
    .populate('doctorId', 'fullName');
  res.json(list);
}

async function getPrescriptionForPatient(req,res){
  const { id } = req.params;
  const prescription = await Prescription.findById(id).populate('patientId', 'fullName').populate('doctorId', 'fullName');
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  // Check access
  if (req.user.role === 'doctor' && prescription.doctorId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  } else if (req.user.role === 'patient' && prescription.patientId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(prescription);
}

async function deletePrescription(req, res) {
  const { id } = req.params;
  const prescription = await Prescription.findById(id);
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  // Check if doctor is the creator
  if (prescription.doctorId.toString() !== req.user.id) {
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
    patientId: patientId,
    doctorId: req.user.id,
    tests: [testName],
    notes,
    dueDate: dueDate ? new Date(dueDate) : undefined
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
  try {
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Forbidden - Doctor access required' });
    }
    const requests = await LabRequest.find({ doctorId: req.user.id })
      .sort({ requestedAt: -1 })
      .populate('patientId', 'fullName');
    res.json(requests);
  } catch (err) {
    console.error('listAllLabRequests error', err);
    res.status(500).json({ error: 'Server error' });
  }
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
  res.json(request);
}

async function deleteLabRequest(req, res) {
  const { id } = req.params;
  const request = await LabRequest.findById(id);
  if (!request) return res.status(404).json({ error: 'Not found' });
  // Check if doctor is assigned
  const patient = await User.findById(request.patientId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await LabRequest.findByIdAndDelete(id);
  res.json({ message: 'Lab request deleted' });
}

async function getChatMessages(req, res) {
  const { patientId } = req.params;
  // Check if the patientId is one of this doctor's patients
  const patient = await User.findById(patientId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Use Message model for chat messages (unified with patient chat)
  const Message = require('../models/Message');
  const messages = await Message.find({
    $or: [
      { sender: req.user.id, receiver: patientId },
      { sender: patientId, receiver: req.user.id }
    ]
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'fullName role')
    .populate('receiver', 'fullName role')
    .lean();

  res.json({ messages });
}

async function sendChatMessage(req, res) {
  const { messageText, imageUrl } = req.body;
  const { patientId } = req.params;

  // Check if patientId is one of this doctor's patients
  const patient = await User.findById(patientId);
  if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!messageText && !imageUrl) {
    return res.status(400).json({ error: 'Message text or image required' });
  }

  const Message = require('../models/Message');
  const message = await Message.create({
    sender: req.user.id,
    receiver: patientId,
    text: messageText,
    // Optionally add attachment/imageUrl if you want to support it in Message model
    createdAt: new Date()
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
  const qrDataURL = await QRCode.toDataURL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-prescription.html?code=${prescription.verificationCode}`);
  // For simplicity, since PDFKit doesn't directly support images from dataURL, we'll add a placeholder
  doc.fontSize(10).text('Scan QR Code to verify:');
  doc.text(prescription.verificationCode); // Placeholder, ideally embed QR image

  doc.end();
}

async function verifyPrescription(req, res) {
  const { code } = req.params;
  const prescription = await Prescription.findOne({ verificationCode: code }).populate('patient', 'fullName').populate('doctor', 'fullName');
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
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Forbidden - Doctor access required' });
    }
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('patientId', 'fullName');
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

    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    appointment.status = status;
    if (messageFromDoctor) appointment.messageFromDoctor = messageFromDoctor;
    if (status === 'rescheduled' && newDate) {
      appointment.date = new Date(newDate);
    }

    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error('updateAppointmentStatus error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// Helper function to validate doctor-patient relationship
async function validateDoctorPatientRelationship(doctorId, patientId) {
  const patient = await User.findById(patientId).select('assignedDoctor fullName');
  
  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }
  
  if (!patient.assignedDoctor || String(patient.assignedDoctor) !== String(doctorId)) {
    const error = new Error('Not authorized for this patient');
    error.statusCode = 403;
    throw error;
  }
  
  return patient;
}

// POST /api/doctor/note
async function addDoctorNote(req, res) {
  try {
    const { patientId, noteText } = req.body;
    
    // Validate required fields
    if (!patientId || !noteText) {
      return res.status(400).json({ error: 'patientId and noteText are required' });
    }
    
    // Validate doctor-patient relationship
    const patient = await validateDoctorPatientRelationship(req.user.id, patientId);
    
    // Create medical note
    const note = await MedicalLog.create({
      patientId,
      doctorId: req.user.id,
      type: 'note',
      description: noteText
    });
    
    // Send notification to patient
    await createNotification({
      user: patientId,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.COMMENT,
      message: 'Your doctor added a new note to your medical record',
      link: `/patient/dashboard.html`,
      meta: { noteId: note._id, type: 'doctor_note' }
    });
    
    res.json({
      success: true,
      message: 'Note created and patient notified',
      note
    });
  } catch (err) {
    console.error('addDoctorNote error:', err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ 
      error: err.message || 'Server error' 
    });
  }
}

// POST /api/doctor/prescription
async function createDoctorPrescription(req, res) {
  try {
    const { patientId, items, notes, insulinType, dosage, deviceType, startDate, endDate } = req.body;
    
    // Validate required fields
    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }
    
    if (!items && !insulinType && !deviceType) {
      return res.status(400).json({ error: 'items, insulinType, or deviceType is required' });
    }
    
    // Validate doctor-patient relationship
    const patient = await validateDoctorPatientRelationship(req.user.id, patientId);
    
    // Build prescription items
    let prescriptionItems = items || [];
    
    // Add insulin/device if provided
    if (insulinType || deviceType) {
      prescriptionItems.push({
        name: insulinType || deviceType,
        dose: dosage || 'As prescribed',
        frequency: startDate && endDate 
          ? `From ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
          : 'As directed',
        type: insulinType ? 'insulin' : 'device'
      });
    }
    
    if (prescriptionItems.length === 0) {
      return res.status(400).json({ error: 'At least one prescription item is required' });
    }
    
    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
    
    // Create prescription
    const prescription = await Prescription.create({
      patientId: patientId,
      doctorId: req.user.id,
      items: prescriptionItems,
      notes,
      verificationCode
    });
    
    await prescription.populate('patient', 'fullName');
    
    // Send notification to patient
    const doctorUser = await User.findById(req.user.id).select('fullName');
    await createNotification({
      user: patientId,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.PRESCRIPTION_NEW,
      message: `${doctorUser.fullName || 'Your doctor'} created a new prescription for you`,
      link: `/patient/prescriptions.html?prescription=${prescription._id}`,
      meta: { prescriptionId: prescription._id, type: 'doctor_prescription' }
    });
    
    res.json({
      success: true,
      message: 'Prescription created and patient notified',
      prescription
    });
  } catch (err) {
    console.error('createDoctorPrescription error:', err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ 
      error: err.message || 'Server error' 
    });
  }
}

// POST /api/doctor/lab-request
async function requestLabTest(req, res) {
  try {
    const { patientId, testType, instructions } = req.body;
    
    // Validate required fields
    if (!patientId || !testType) {
      return res.status(400).json({ error: 'patientId and testType are required' });
    }
    
    // Validate doctor-patient relationship
    const patient = await validateDoctorPatientRelationship(req.user.id, patientId);
    
    // Create lab request
    const labRequest = await LabRequest.create({
      patient: patientId,
      doctor: req.user.id,
      testName: testType,
      doctorComment: instructions || '',
      status: 'requested',
      requestedAt: new Date()
    });
    
    // Send notification to patient
    const doctorUser = await User.findById(req.user.id).select('fullName');
    await createNotification({
      user: patientId,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.LAB_REQUEST,
      message: `${doctorUser.fullName || 'Your doctor'} requested a new lab test: ${testType}`,
      link: `/patient/labs.html?request=${labRequest._id}`,
      meta: { labRequestId: labRequest._id, type: 'doctor_lab_request' }
    });
    
    res.json({
      success: true,
      message: 'Lab request created and patient notified',
      labRequest
    });
  } catch (err) {
    console.error('requestLabTest error:', err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ 
      error: err.message || 'Server error' 
    });
  }
}

