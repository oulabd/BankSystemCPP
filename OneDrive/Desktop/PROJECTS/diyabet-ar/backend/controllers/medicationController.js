const MedicationRecord = require('../models/MedicationRecord');
const User = require('../models/User');
const DailyRecord = require('../models/DailyRecord');

// POST /api/medication/add
async function addMedicationRecord(req, res) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can add medication records' });
    }

    const { medicationType, name, dose, unit, timing, notes, linkedGlucoseRecord } = req.body;

    // Validation
    if (!medicationType || !name || !dose || !unit || !timing) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (typeof dose !== 'number' || dose <= 0) {
      return res.status(400).json({ error: 'Dose must be a positive number' });
    }

    // Get assigned doctor
    const patient = await User.findById(req.user.id);
    const doctorId = patient.assignedDoctor;

    const medicationRecord = await MedicationRecord.create({
      patient: req.user.id,
      doctor: doctorId,
      medicationType,
      name,
      dose,
      unit,
      timing,
      notes,
      linkedGlucoseRecord,
      isRecommendation: false
    });

    await medicationRecord.populate('doctor', 'fullName');

    res.json(medicationRecord);
  } catch (err) {
    console.error('addMedicationRecord error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/medication/mine
async function getMyMedicationRecords(req, res) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can access this endpoint' });
    }

    const { medicationType, startDate, endDate, limit = 100 } = req.query;

    const query = { patient: req.user.id };

    if (medicationType) {
      query.medicationType = medicationType;
    }

    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const records = await MedicationRecord.find(query)
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit))
      .populate('doctor', 'fullName')
      .populate('linkedGlucoseRecord', 'value date');

    res.json({ records });
  } catch (err) {
    console.error('getMyMedicationRecords error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/medication/patient/:id
async function getPatientMedicationRecords(req, res) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can access this endpoint' });
    }

    const { id } = req.params;
    const { medicationType, startDate, endDate, limit = 100 } = req.query;

    // Verify patient is assigned to this doctor
    const patient = await User.findById(id);
    if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const query = { patient: id };

    if (medicationType) {
      query.medicationType = medicationType;
    }

    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const records = await MedicationRecord.find(query)
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit))
      .populate('patient', 'fullName')
      .populate('linkedGlucoseRecord', 'value date');

    // Get glucose records for correlation
    const glucoseRecords = await DailyRecord.find({ patient: id })
      .sort({ date: -1 })
      .limit(50);

    res.json({ records, glucoseRecords });
  } catch (err) {
    console.error('getPatientMedicationRecords error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/medication/recommend
async function recommendMedication(req, res) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can recommend medication' });
    }

    const { patientId, medicationType, name, dose, unit, timing, notes } = req.body;

    // Validation
    if (!patientId || !medicationType || !name || !dose || !unit || !timing) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (typeof dose !== 'number' || dose <= 0) {
      return res.status(400).json({ error: 'Dose must be a positive number' });
    }

    // Verify patient is assigned to this doctor
    const patient = await User.findById(patientId);
    if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const recommendation = await MedicationRecord.create({
      patient: patientId,
      doctor: req.user.id,
      medicationType,
      name,
      dose,
      unit,
      timing,
      notes,
      isRecommendation: true
    });

    await recommendation.populate('patient', 'fullName');

    res.json(recommendation);
  } catch (err) {
    console.error('recommendMedication error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// PUT /api/medication/:id
async function updateMedicationRecord(req, res) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can edit medication records' });
    }

    const { id } = req.params;
    const { dose, unit, timing, notes } = req.body;

    const record = await MedicationRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: 'Medication record not found' });
    }

    // Verify patient is assigned to this doctor
    const patient = await User.findById(record.patient);
    if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Doctors can only update dose, unit, timing, and notes
    if (dose !== undefined) {
      if (typeof dose !== 'number' || dose <= 0) {
        return res.status(400).json({ error: 'Dose must be a positive number' });
      }
      record.dose = dose;
    }

    if (unit) record.unit = unit;
    if (timing) record.timing = timing;
    if (notes !== undefined) record.notes = notes;

    await record.save();
    await record.populate('patient', 'fullName');

    res.json(record);
  } catch (err) {
    console.error('updateMedicationRecord error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// DELETE /api/medication/:id
async function deleteMedicationRecord(req, res) {
  try {
    const { id } = req.params;

    const record = await MedicationRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: 'Medication record not found' });
    }

    // Patients can delete their own records, doctors can delete any patient's record
    if (req.user.role === 'patient' && record.patient.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'doctor') {
      const patient = await User.findById(record.patient);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    await MedicationRecord.findByIdAndDelete(id);
    res.json({ message: 'Medication record deleted successfully' });
  } catch (err) {
    console.error('deleteMedicationRecord error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/medication/stats/:patientId
async function getMedicationStats(req, res) {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can access medication stats' });
    }

    const { patientId } = req.params;

    // Verify patient is assigned to this doctor
    const patient = await User.findById(patientId);
    if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const stats = await MedicationRecord.aggregate([
      { $match: { patient: patient._id } },
      {
        $group: {
          _id: '$medicationType',
          count: { $sum: 1 },
          totalDose: { $sum: '$dose' },
          avgDose: { $avg: '$dose' }
        }
      }
    ]);

    res.json({ stats });
  } catch (err) {
    console.error('getMedicationStats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  addMedicationRecord,
  getMyMedicationRecords,
  getPatientMedicationRecords,
  recommendMedication,
  updateMedicationRecord,
  deleteMedicationRecord,
  getMedicationStats
};
