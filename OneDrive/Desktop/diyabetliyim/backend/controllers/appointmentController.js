const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendNotification } = require('../controllers/notificationController');

function dayRangeForDate(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

exports.createAppointment = async (req, res) => {
  try {
    const patientId = req.user && req.user._id;
    if (!patientId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { doctorId, date } = req.body;
    if (!doctorId || !date) return res.status(400).json({ success: false, message: 'doctorId and date are required' });

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctorId' });
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const now = new Date();
    if (appointmentDate < now) {
      return res.status(400).json({ success: false, message: 'Appointment date must be in the future' });
    }

    // Prevent duplicate booking same patient + doctor on same day
    const { start, end } = dayRangeForDate(appointmentDate);
    const existing = await Appointment.findOne({
      patientId: patientId,
      doctorId: doctorId,
      date: { $gte: start, $lt: end },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have an appointment with this doctor on that day' });
    }

    const appt = new Appointment({
      patientId: patientId,
      doctorId,
      date: appointmentDate,
      createdBy: patientId,
    });

    await appt.save();

    return res.status(201).json({ success: true, message: 'Appointment created', data: appt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyAppointmentsForPatient = async (req, res) => {
  try {
    const patientId = req.user && req.user._id;
    if (!patientId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name email')
      .sort({ date: -1 });

    return res.json({ success: true, message: 'Patient appointments fetched', data: appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyAppointmentsForDoctor = async (req, res) => {
  try {
    const doctorId = req.user && req.user._id;
    if (!doctorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    let appointments = await Appointment.find({ doctorId }).populate('patientId', 'name email');

    // Sort: pending first, then by date ascending
    const order = { pending: 0, approved: 1, rejected: 2, done: 3 };
    appointments = appointments.sort((a, b) => {
      const aOrder = order[a.status] ?? 9;
      const bOrder = order[b.status] ?? 9;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.date) - new Date(b.date);
    });

    return res.json({ success: true, message: "Doctor's appointments fetched", data: appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const apptId = req.params.id;
    const { status, noteFromDoctor } = req.body;

    if (!['approved', 'rejected', 'done'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const appt = await Appointment.findById(apptId);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Only the assigned doctor may modify the status
    if (appt.doctorId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not allowed to modify this appointment' });
    }

    // Only allow transition from pending -> (approved|rejected|done)
    if (appt.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending appointments can have their status changed' });
    }

    appt.status = status;
    if (noteFromDoctor) appt.noteFromDoctor = noteFromDoctor;

    await appt.save();

    return res.json({ success: true, message: 'Appointment updated', data: appt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const { limit = 20, skip = 0, status, doctorId, patientId } = req.query;
    const q = {};
    if (status) q.status = status;
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) q.doctorId = doctorId;
    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) q.patientId = patientId;

    const [items, total] = await Promise.all([
      Appointment.find(q)
        .populate('patientId', 'name email')
        .populate('doctorId', 'name email')
        .sort({ date: -1 })
        .skip(parseInt(skip, 10))
        .limit(parseInt(limit, 10)),
      Appointment.countDocuments(q),
    ]);

    return res.json({ success: true, message: 'Appointments fetched', data: { items, total } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

function isValidTimeString(t) {
  if (typeof t !== 'string') return false;
  // HH:MM 24-hour
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
}

function isFutureDate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return false;
  // compare YYYY-MM-DD without time portion: appointment date must be >= today? Requirement: future date
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return dt.getTime() >= now.getTime();
}

exports.createAppointment = async function(req, res) {
  try {
    const patientId = req.user && req.user._id;
    if (!patientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', error: 'No user' });
    }

    // Only patients allowed (routes also restrict, but double-check)
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Forbidden: only patients can create appointments', error: 'forbidden' });
    }

    const { doctorId, date, time, reason } = req.body;

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Validation error', error: 'doctorId is required and must be a valid id' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Validation error', error: 'date is required' });
    }
    if (!time || !isValidTimeString(time)) {
      return res.status(400).json({ success: false, message: 'Validation error', error: 'time is required and must be in HH:MM format' });
    }
    if (!isFutureDate(date)) {
      return res.status(400).json({ success: false, message: 'Validation error', error: 'date must be today or in the future' });
    }

    // Verify doctor exists and is a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found', error: 'doctor_not_found' });
    }
    if (doctor.role !== 'doctor') {
      return res.status(400).json({ success: false, message: 'User is not a doctor', error: 'invalid_doctor' });
    }

    // (Optional) verify patient exists - req.user should be valid
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found', error: 'patient_not_found' });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId,
      doctorId,
      date: new Date(date),
      time,
      reason,
    });

    const saved = await appointment.save();

    await sendNotification(
      saved.doctorId,
      "New appointment booked by patient",
      "appointment",
      saved._id
    );

    return res.status(201).json({ success: true, message: 'Appointment created', data: saved });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create appointment', error: err.message });
  }
};

exports.getMyAppointments = async function(req, res) {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized', error: 'No user' });
    }

    let query = {};
    if (req.user.role === 'patient') {
      query.patientId = userId;
    } else if (req.user.role === 'doctor') {
      query.doctorId = userId;
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'role_not_allowed' });
    }

    const appointments = await Appointment.find(query).sort({ date: -1, time: -1 }).populate('doctorId', 'fullName email').populate('patientId', 'fullName email');

    return res.json({ success: true, message: 'Appointments fetched', data: appointments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch appointments', error: err.message });
  }
};

exports.getAppointmentById = async function(req, res) {
  try {
    const userId = req.user && req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id', error: 'invalid_id' });
    }

    const appointment = await Appointment.findById(id).populate('doctorId', 'fullName email role').populate('patientId', 'fullName email role');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found', error: 'not_found' });
    }

    // Only patient or doctor involved may view
    if (appointment.patientId._id.toString() !== userId.toString() && appointment.doctorId._id.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'not_authorized' });
    }

    return res.json({ success: true, message: 'Appointment fetched', data: appointment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch appointment', error: err.message });
  }
};

exports.updateAppointment = async function(req, res) {
  try {
    const userId = req.user && req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id', error: 'invalid_id' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found', error: 'not_found' });
    }

    // Only patient or doctor involved may edit (with different allowed fields)
    const isPatient = appointment.patientId.toString() === userId.toString();
    const isDoctor = appointment.doctorId.toString() === userId.toString();

    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'not_authorized' });
    }

    // Cannot edit cancelled appointment
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot edit a cancelled appointment', error: 'cancelled' });
    }

    // Patient can update date, time, reason
    if (isPatient) {
      const { date, time, reason } = req.body;
      if (date) {
        if (!isFutureDate(date)) {
          return res.status(400).json({ success: false, message: 'Validation error', error: 'date must be today or in the future' });
        }
        appointment.date = new Date(date);
      }
      if (time) {
        if (!isValidTimeString(time)) {
          return res.status(400).json({ success: false, message: 'Validation error', error: 'time must be HH:MM' });
        }
        appointment.time = time;
      }
      if (reason !== undefined) appointment.reason = reason;
    }

    // Doctor can update notes and status
    if (isDoctor) {
      const { notes, status } = req.body;
      if (status) {
        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
          return res.status(400).json({ success: false, message: 'Validation error', error: 'invalid status' });
        }
        appointment.status = status;
      }
      if (notes !== undefined) appointment.notes = notes;
    }

    const updated = await appointment.save();
    return res.json({ success: true, message: 'Appointment updated', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update appointment', error: err.message });
  }
};

exports.cancelAppointment = async function(req, res) {
  try {
    const userId = req.user && req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id', error: 'invalid_id' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found', error: 'not_found' });
    }

    // Patient or doctor involved may cancel
    const isPatient = appointment.patientId.toString() === userId.toString();
    const isDoctor = appointment.doctorId.toString() === userId.toString();

    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'not_authorized' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Appointment already cancelled', error: 'already_cancelled' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    return res.json({ success: true, message: 'Appointment cancelled', data: appointment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to cancel appointment', error: err.message });
  }
};