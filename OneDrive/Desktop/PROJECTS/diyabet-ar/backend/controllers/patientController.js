// GET /api/patient/records (for patient self)
async function getPatientRecords(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await DailyRecord.find({
      patientId: req.user.id,
      day: today
    });
    res.json(records);
  } catch (err) {
    console.error('getPatientRecords error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/doctor/patient/:id/records (for doctor to fetch by patientId)
async function getPatientRecordsById(req, res) {
  try {
    const { id } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await DailyRecord.find({
      patientId: id,
      day: today
    });
    res.json(records);
  } catch (err) {
    console.error('getPatientRecordsById error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const DailyRecord = require('../models/DailyRecord');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const LabRequest = require('../models/LabRequest');
const Appointment = require('../models/Appointment');
const Chat = require('../models/Chat');
// const Notification = require('../models/Notification');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/auditLogger');
const {
  generateAccessToken,
  createSession
} = require('../utils/tokenService');
const { logDataDecryption } = require('../utils/auditLogger');
const path = require('path');
const fs = require('fs');

// Simple i18n for PDF generation


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

// PUT /api/patient/profile
async function updateProfile(req, res) {
  try {
    const { fullName, phone, address, birthDate, identityNumber } = req.body;
    const patient = await User.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (fullName) patient.fullName = fullName;
    if (phone) patient.phone = phone;
    if (address) patient.address = address;
    if (birthDate) patient.birthdate = birthDate; // Also set birthdate field
    if (identityNumber) patient.identityNumber = identityNumber;

    await patient.save();

    // Always return decrypted data
    res.json({ message: 'Profile updated successfully', user: patient.getDecryptedData() });
  } catch (err) {
    console.error('updateProfile error:', err);
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
  try {
    const patientId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if record already exists for today
    let existingRecord = await DailyRecord.findOne({ patientId, day: today });
    if (existingRecord) {
      return res.status(409).json({ message: 'Record already exists for today' });
    }

    // Create new DailyRecord with all measurement fields
    const recordData = {
      patientId,
      day: today,
      fasting: req.body.fasting || null,
      beforeBreakfast: req.body.beforeBreakfast || null,
      afterBreakfast: req.body.afterBreakfast || null,
      beforeLunch: req.body.beforeLunch || null,
      afterLunch: req.body.afterLunch || null,
      beforeDinner: req.body.beforeDinner || null,
      afterDinner: req.body.afterDinner || null,
      snack1: req.body.snack1 || null,
      snack2: req.body.snack2 || null,
      snack3: req.body.snack3 || null,
      measurement_12am: req.body.measurement_12am || null,
      measurement_3am: req.body.measurement_3am || null,
      breakfastCarbs: req.body.breakfastCarbs || null,
      lunchCarbs: req.body.lunchCarbs || null,
      dinnerCarbs: req.body.dinnerCarbs || null,
      breakfastInsulin: req.body.breakfastInsulin || null,
      lunchInsulin: req.body.lunchInsulin || null,
      dinnerInsulin: req.body.dinnerInsulin || null,
      lantus: req.body.lantus || null,
      notes: req.body.notes || null
    };

    const record = await DailyRecord.create(recordData);

    // Notify assigned doctor if exists
    const user = await User.findById(patientId);
    if (user && user.assignedDoctor) {
      await createNotification({
        user: user.assignedDoctor,
        sender: patientId,
        type: NOTIFICATION_TYPES.RECORD_ADDED,
        message: `Patient ${user.fullName} added daily measurements`,
        link: `/doctor/patient/${patientId}/records`,
        meta: { recordId: record._id, patientId }
      });
    }

    return res.status(201).json({ message: 'record saved', record });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getMyRecords(req, res) {
  try {
    const patientId = req.user._id;
    const { start, end } = req.query;
    
    // Build query
    let query = { patientId };
    // Add date range if provided (use 'day' field, not 'createdAt')
    if (start || end) {
      query.day = {};
      if (start) query.day.$gte = new Date(start);
      if (end) query.day.$lte = new Date(end);
    }
    const records = await DailyRecord.find(query).sort({ day: -1 });
    return res.json({ records });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateRecord(req, res) {
  try {
    const patientId = req.user._id;
    const recordId = req.params.id;

    // Debug logging
    console.log('[updateRecord] patientId:', patientId);
    console.log('[updateRecord] recordId:', recordId);
    console.log('[updateRecord] req.body:', req.body);

    // Verify record belongs to patient
    const record = await DailyRecord.findById(recordId);
    if (!record || record.patientId.toString() !== patientId.toString()) {
      console.error('[updateRecord] Unauthorized access or record not found');
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update fields
    record.fasting = req.body.fasting !== undefined ? req.body.fasting : record.fasting;
    record.beforeBreakfast = req.body.beforeBreakfast !== undefined ? req.body.beforeBreakfast : record.beforeBreakfast;
    record.afterBreakfast = req.body.afterBreakfast !== undefined ? req.body.afterBreakfast : record.afterBreakfast;
    record.beforeLunch = req.body.beforeLunch !== undefined ? req.body.beforeLunch : record.beforeLunch;
    record.afterLunch = req.body.afterLunch !== undefined ? req.body.afterLunch : record.afterLunch;
    record.beforeDinner = req.body.beforeDinner !== undefined ? req.body.beforeDinner : record.beforeDinner;
    record.afterDinner = req.body.afterDinner !== undefined ? req.body.afterDinner : record.afterDinner;
    record.snack1 = req.body.snack1 !== undefined ? req.body.snack1 : record.snack1;
    record.snack2 = req.body.snack2 !== undefined ? req.body.snack2 : record.snack2;
    record.snack3 = req.body.snack3 !== undefined ? req.body.snack3 : record.snack3;
    record.measurement_12am = req.body.measurement_12am !== undefined ? req.body.measurement_12am : record.measurement_12am;
    record.measurement_3am = req.body.measurement_3am !== undefined ? req.body.measurement_3am : record.measurement_3am;
    record.breakfastCarbs = req.body.breakfastCarbs !== undefined ? req.body.breakfastCarbs : record.breakfastCarbs;
    record.lunchCarbs = req.body.lunchCarbs !== undefined ? req.body.lunchCarbs : record.lunchCarbs;
    record.dinnerCarbs = req.body.dinnerCarbs !== undefined ? req.body.dinnerCarbs : record.dinnerCarbs;
    record.breakfastInsulin = req.body.breakfastInsulin !== undefined ? req.body.breakfastInsulin : record.breakfastInsulin;
    record.lunchInsulin = req.body.lunchInsulin !== undefined ? req.body.lunchInsulin : record.lunchInsulin;
    record.dinnerInsulin = req.body.dinnerInsulin !== undefined ? req.body.dinnerInsulin : record.dinnerInsulin;
    record.lantus = req.body.lantus !== undefined ? req.body.lantus : record.lantus;
    record.notes = req.body.notes !== undefined ? req.body.notes : record.notes;

    try {
      await record.save();
    } catch (saveErr) {
      console.error('[updateRecord] Error saving record:', saveErr);
      return res.status(500).json({ message: saveErr.message, error: saveErr });
    }

    // Notify doctor of update
    const user = await User.findById(patientId);
    if (user && user.assignedDoctor) {
      await createNotification({
        user: user.assignedDoctor,
        sender: patientId,
        type: NOTIFICATION_TYPES.RECORD_ADDED,
        message: `Patient ${user.fullName} updated daily measurements`,
        link: `/doctor/patient/${patientId}/records`,
        meta: { recordId: record._id, patientId }
      });
    }

    return res.json({ message: 'record updated', record });
  } catch (err) {
    console.error('[updateRecord] General error:', err);
    return res.status(500).json({ message: err.message, error: err });
  }
}

async function deleteRecord(req, res) {
  try {
    const patientId = req.user.id;
    const recordId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Invalid record id' });
    }

    const record = await DailyRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (record.patientId.toString() !== patientId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await DailyRecord.deleteOne({ _id: recordId });

    return res.json({ message: 'Record deleted' });
  } catch (err) {
    console.error('[deleteRecord] Error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function getMyLabRequests(req, res) {
  try {
    const requests = await LabRequest.find({ patientId: req.user._id }).sort({ requestedAt: -1 }).populate('doctorId', 'fullName');
    return res.json(requests);
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
    console.log('[getMyPrescriptions] userId:', req.user._id);
    const prescriptions = await Prescription.find({ patientId: req.user._id }).sort({ createdAt: -1 }).populate('doctorId', 'fullName');
    console.log('[getMyPrescriptions] found:', prescriptions.length, 'prescriptions');
    if (prescriptions.length > 0) {
      console.log('[getMyPrescriptions] first prescription patientId:', prescriptions[0].patientId, 'doctorId:', prescriptions[0].doctorId);
    }
    // Ensure legacy fields are present for frontend cards
    const mapped = prescriptions.map(p => {
      const primary = p.items && p.items.length ? p.items[0] : null;
      const obj = {
        ...p.toObject(),
        name: p.name || primary?.name || 'Prescription',
        dose: p.dose || primary?.dose || '',
        frequency: p.frequency || primary?.frequency || '',
        duration: p.duration || primary?.duration || '',
        type: p.type || primary?.type || ''
      };
      // Always include verificationCode for QR
      if (p.verificationCode) obj.verificationCode = p.verificationCode;
      return obj;
    });

    return res.json({ prescriptions: mapped });
  } catch (err) {
    console.error('[getMyPrescriptions] error:', err);
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
  // await Notification.create({
  //   userId: receiverId,
  //   type: 'message',
  //   fromUser: req.user._id,
  //   message: 'New message from your patient',
  //   relatedId: message._id
  // });

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
    user: prescription.doctor,
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

    doc.fontSize(20).fillColor('#20caa8').text('Sistem: DİYABETLİYİM', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).fillColor('black').text('Tıbbi Rapor', { align: 'center' });
    doc.moveDown();

    // Hasta Bilgileri
    doc.fontSize(14).fillColor('#20caa8').text('Hasta Bilgileri');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    doc.text(`Ad Soyad: ${patient.fullName}`);
    doc.text(`Kimlik Numarası: ${patient.identityNumber || 'Yok'}`);
    doc.text(`Doğum Tarihi: ${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Yok'}`);
    doc.moveDown();

    // Glukoz Geçmişi
    doc.fontSize(14).fillColor('#20caa8').text('Glukoz Geçmişi');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    glucoseReadings.forEach(reading => {
      doc.text(`${new Date(reading.date).toLocaleDateString()}: ${reading.value} mg/dL`);
    });
    doc.moveDown();

    // Reçeteler
    doc.fontSize(14).fillColor('#20caa8').text('Reçeteler');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    prescriptions.forEach(pres => {
      doc.text(`${pres.name} - ${pres.dose} - ${pres.frequency} - ${pres.doctorId.fullName}`);
    });
    doc.moveDown();

    // Laboratuvar İstekleri
    doc.fontSize(14).fillColor('#20caa8').text('Laboratuvar İstekleri');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    labRequests.forEach(lab => {
      doc.text(`${lab.testName} - ${new Date(lab.createdAt).toLocaleDateString()} - ${lab.doctorId.fullName}`);
    });
    doc.moveDown();

    // Tıbbi Kayıtlar
    doc.fontSize(14).fillColor('#20caa8').text('Tıbbi Kayıtlar');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('black');
    medicalLogs.forEach(log => {
      doc.text(`${new Date(log.createdAt).toLocaleDateString()}: ${log.type} - ${log.description} (${log.doctorId.fullName})`);
    });
    doc.moveDown();

    // Footer
    doc.fontSize(10).fillColor('gray').text(`Oluşturulma Tarihi: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    return res.status(500).json({ message: 'Error generating report' });
  }
}

async function createAppointment(req, res) {
  try {
    const { date, reason, time } = req.body;
    const patientId = req.user._id;

    // Get patient's assigned doctor
    const patient = await User.findById(patientId);
    if (!patient || !patient.assignedDoctor) {
      return res.status(400).json({ message: 'No assigned doctor found' });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId: patient.assignedDoctor,
      date: new Date(date),
      time: time || '10:00',
      notes: reason,
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
    const appointments = await Appointment.find({ patientId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'fullName');
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

    if (appointment.patientId.toString() !== req.user._id.toString()) {
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

// GET /api/patient/prescriptions
async function getPatientPrescriptions(req, res) {
  try {
    const patientId = req.user.id;
    const prescriptions = await Prescription.find({ patientId: patientId })
      .populate('doctor', 'fullName')
      .sort({ createdAt: -1 });
    const flat = prescriptions.flatMap(p =>
      p.items.map(it => ({
        medication: it.name,
        dose: it.dose,
        frequency: it.frequency,
        duration: it.duration || '—',
        notes: p.notes || '',
        issuedAt: p.createdAt,
        doctorName: p.doctor?.fullName || 'Doctor',
        prescriptionId: p._id
      }))
    );
    res.json(flat);
  } catch (e) {
    console.error('getPatientPrescriptions', e);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/patient/labs
async function getPatientLabs(req, res) {
  try {
    if (req.user.role !== 'patient') return res.status(403).json({ error: 'Forbidden' });
    const labs = await LabRequest.find({ patient: req.user.id }).sort({ requestedAt: -1 });
    const payload = labs.map(l => ({
      _id: l._id,
      testType: l.testName,
      instructions: l.doctorComment || '',
      status: l.status || 'requested',
      resultFile: l.resultFile || null,
      requestedAt: l.requestedAt
    }));
    res.json(payload);
  } catch (err) {
    console.error('getPatientLabs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/patient/lab/upload/:labId
async function uploadPatientLab(req, res) {
  try {
    if (req.user.role !== 'patient') return res.status(403).json({ error: 'Forbidden' });
    const { labId } = req.params;
    const lab = await LabRequest.findById(labId);
    if (!lab || lab.patient.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Lab request not found' });
    }
    if (!req.file) return res.status(400).json({ error: 'PDF file required' });

    // Ensure uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'labs');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // Save PDF
    const safeName = `lab-${labId}-${Date.now()}.pdf`;
    const fullPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(fullPath, req.file.buffer);

    lab.status = 'completed';
    lab.resultFile = `/uploads/labs/${safeName}`;
    lab.updatedAt = new Date();
    await lab.save();

    res.json({ success: true, id: lab._id, resultFile: lab.resultFile, status: lab.status });
  } catch (err) {
    console.error('uploadPatientLab error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/patient/appointments
async function getPatientAppointments(req, res) {
  try {
    const patientId = req.user.id;
    const appts = await Appointment.find({ patient: patientId })
      .populate('doctor', 'fullName')
      .sort({ date: -1 });
    res.json(appts.map(a => ({
      id: a._id,
      requestedDate: a.date,
      status: a.status,
      doctorName: a.doctor?.fullName || 'Doctor',
      reason: a.reason || '',
      messageFromDoctor: a.messageFromDoctor || ''
    })));
  } catch (e) {
    console.error('getPatientAppointments', e);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/patient/notifications
async function getPatientNotifications(req, res) {
  try {
    const list = await listNotifications(req.user.id, { limit: 100 });
    res.json(list);
  } catch (e) {
    console.error('getPatientNotifications', e);
    res.status(500).json({ error: 'Server error' });
  }
}

// PUT /api/patient/notification/read/:id
async function markPatientNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const updated = await markAsRead(req.user.id, id);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    console.error('markPatientNotificationRead', e);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/patient/change-password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (e) {
    console.error('changePassword', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  sendQuestion,
  addRecord,
  updateRecord,
  deleteRecord,
  getMyRecords,
  getMyPrescriptions,
  getMyLabRequests,
  uploadLabResult,
  getInsulinAdjustments,
  getPrescriptionPDF,
  getChatMessages,
  sendChatMessage,
  markMessageAsRead,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  requestPrescriptionRenewal,
  getMedicalLogs,
  exportMedicalReport,
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  addDailyRecord,
  login,
  getPatientPrescriptions,
  getPatientLabs,
  uploadPatientLab,
  getPatientAppointments,
  getPatientNotifications,
  markPatientNotificationRead,
  changePassword,
  getPatientRecords,
  getPatientRecordsById
};
