const Prescription = require('../models/Prescription');
const User = require('../models/User');
const mongoose = require('mongoose');

async function deactivateExpired() {
  try {
    await Prescription.updateMany({ isActive: true, expiresAt: { $lt: new Date() } }, { isActive: false });
  } catch (err) {
    // non-fatal; callers will still proceed
    console.error('Failed to deactivate expired prescriptions', err.message);
  }
}

exports.createPrescription = async (req, res) => {
    console.log('[createPrescription] patientId:', patientId, 'doctorId:', doctorId);
  try {
    const actorId = req.user && req.user._id;
    const actorRole = req.user && req.user.role;
    if (!actorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!['doctor', 'admin'].includes(actorRole)) {
      return res.status(403).json({ success: false, message: 'Only doctor or admin can create prescriptions' });
    }

    const { patientId, doctorId: providedDoctorId, type, medicationName, dosage, units, notes, expiresAt } = req.body;

    if (!patientId) return res.status(400).json({ success: false, message: 'patientId is required' });
    if (!medicationName) return res.status(400).json({ success: false, message: 'medicationName is required' });
    if (!dosage) return res.status(400).json({ success: false, message: 'dosage is required' });
    if (!units) return res.status(400).json({ success: false, message: 'units is required' });
    if (!['insulin', 'sensor'].includes(type)) return res.status(400).json({ success: false, message: 'Invalid type' });
    if (!expiresAt) return res.status(400).json({ success: false, message: 'expiresAt is required' });

    if (!mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ success: false, message: 'Invalid patientId' });

    // determine doctorId: doctors should act as themselves; admins may provide doctorId
    let doctorId = providedDoctorId;
    if (actorRole === 'doctor') {
      doctorId = actorId;
    }

    if (!doctorId) return res.status(400).json({ success: false, message: 'doctorId is required' });
    if (!mongoose.Types.ObjectId.isValid(doctorId)) return res.status(400).json({ success: false, message: 'Invalid doctorId' });

    // doctor cannot prescribe to himself unless admin
    if (actorRole === 'doctor' && doctorId.toString() === patientId.toString()) {
      return res.status(403).json({ success: false, message: 'Doctor cannot prescribe to themselves' });
    }

    // validate users exist
    const [patient, doctor] = await Promise.all([User.findById(patientId), User.findById(doctorId)]);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const expDate = new Date(expiresAt);
    if (isNaN(expDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid expiresAt' });
    if (expDate <= new Date()) return res.status(400).json({ success: false, message: 'expiresAt must be in the future' });

    // deactivate expired before checking duplicates
    await deactivateExpired();

    // conflict check: existing active prescription for same patient/doctor/type/medication
    const existing = await Prescription.findOne({
      patientId,
      doctorId,
      type,
      medicationName,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    if (existing) return res.status(409).json({ success: false, message: 'Active prescription already exists for this medication' });


    // Generate a unique verificationCode (simple random string, can be improved)
    function generateVerificationCode(length = 8) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    let verificationCode;
    let isUnique = false;
    // Ensure verificationCode is unique
    while (!isUnique) {
      verificationCode = generateVerificationCode(8);
      // eslint-disable-next-line no-await-in-loop
      const exists = await Prescription.findOne({ verificationCode });
      if (!exists) isUnique = true;
    }


    // Modeldeki ana alanlar ve items dizisi dolduruluyor
    const p = new Prescription({
      patientId,
      doctorId,
      type,
      name: medicationName,
      dose: dosage,
      frequency: req.body.frequency || '',
      duration: req.body.duration || '',
      notes,
      expiresAt: expDate,
      createdBy: actorId,
      verificationCode,
      items: [
        {
          name: medicationName,
          dose: dosage,
          frequency: req.body.frequency || '',
          type: type,
          duration: req.body.duration || ''
        }
      ]
    });

    await p.save();

    return res.status(201).json({ success: true, message: 'Prescription created', data: p, notify: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const actorId = req.user && req.user._id;
    const actorRole = req.user && req.user.role;
    if (!actorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!['doctor', 'admin'].includes(actorRole)) return res.status(403).json({ success: false, message: 'Only doctor or admin can update prescriptions' });

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const p = await Prescription.findById(id);
    if (!p) return res.status(404).json({ success: false, message: 'Prescription not found' });

    // if doctor, ensure they own this prescription
    if (actorRole === 'doctor' && p.doctorId.toString() !== actorId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not allowed to modify this prescription' });
    }

    const { medicationName, dosage, units, notes, expiresAt, isActive } = req.body;
    if (medicationName !== undefined) p.medicationName = medicationName;
    if (dosage !== undefined) p.dosage = dosage;
    if (units !== undefined) p.units = units;
    if (notes !== undefined) p.notes = notes;
    if (isActive !== undefined && actorRole === 'admin') p.isActive = !!isActive; // admin may toggle

    if (expiresAt !== undefined) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid expiresAt' });
      if (expDate <= new Date()) return res.status(400).json({ success: false, message: 'expiresAt must be in the future' });
      p.expiresAt = expDate;
      p.isActive = true;
    }

    await p.save();
    return res.json({ success: true, message: 'Prescription updated', data: p });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.renewPrescription = async (req, res) => {
  try {
    const actorId = req.user && req.user._id;
    const actorRole = req.user && req.user.role;
    if (!actorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!['doctor', 'admin'].includes(actorRole)) return res.status(403).json({ success: false, message: 'Only doctor or admin can renew prescriptions' });

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const old = await Prescription.findById(id);
    if (!old) return res.status(404).json({ success: false, message: 'Prescription not found' });

    // if doctor, ensure they own this prescription
    if (actorRole === 'doctor' && old.doctorId.toString() !== actorId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not allowed to renew this prescription' });
    }

    const { expiresAt } = req.body;
    if (!expiresAt) return res.status(400).json({ success: false, message: 'expiresAt is required for renewal' });
    const expDate = new Date(expiresAt);
    if (isNaN(expDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid expiresAt' });
    if (expDate <= new Date()) return res.status(400).json({ success: false, message: 'expiresAt must be in the future' });

    // create new prescription copying fields
    const np = new Prescription({
      patientId: old.patientId,
      doctorId: old.doctorId,
      type: old.type,
      medicationName: old.medicationName,
      dosage: old.dosage,
      units: old.units,
      notes: old.notes,
      expiresAt: expDate,
      renewedFrom: old._id,
      createdBy: actorId,
    });

    // mark old as inactive
    old.isActive = false;

    await Promise.all([old.save(), np.save()]);

    return res.status(201).json({ success: true, message: 'Prescription renewed', data: np, notify: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyPrescriptions = async (req, res) => {
  try {
    const actorId = req.user && req.user._id;
    const actorRole = req.user && req.user.role;
    if (!actorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (actorRole !== 'patient') return res.status(403).json({ success: false, message: 'Only patients can access their prescriptions here' });

    await deactivateExpired();

    const items = await Prescription.find({ patientId: actorId }).sort({ issuedAt: -1 });
    return res.json({ success: true, message: 'Prescriptions fetched', data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPatientPrescriptions = async (req, res) => {
  try {
    const actorId = req.user && req.user._id;
    const actorRole = req.user && req.user.role;
    if (!actorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!['doctor', 'admin'].includes(actorRole)) return res.status(403).json({ success: false, message: 'Only doctor or admin can view patient prescriptions' });

    const patientId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ success: false, message: 'Invalid patient id' });

    await deactivateExpired();

    const q = { patientId };
    if (actorRole === 'doctor') {
      // doctors only see prescriptions they issued
      q.doctorId = actorId;
    }

    const items = await Prescription.find(q).sort({ issuedAt: -1 });
    return res.json({ success: true, message: 'Patient prescriptions fetched', data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const actorId = req.user && req.user._id;
    const actorRole = req.user && req.user.role;
    if (!actorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (actorRole !== 'admin') return res.status(403).json({ success: false, message: 'Only admin can delete prescriptions' });

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const p = await Prescription.findById(id);
    if (!p) return res.status(404).json({ success: false, message: 'Prescription not found' });

    await Prescription.deleteOne({ _id: id });
    return res.json({ success: true, message: 'Prescription deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

