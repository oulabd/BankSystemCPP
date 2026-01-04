const mongoose = require('mongoose');
const GlucoseRecord = require('../models/GlucoseRecord');
const User = require('../models/User');


/**
 * Normalize a date to start of day (00:00:00) in local time (keeps same date).
 * Accepts date string or Date.
 */
function normalizeDay(input) {
  const d = input ? new Date(input) : new Date();
  // create UTC-like normalized date by zeroing time components
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Helper to validate numeric fields. Returns an array of invalid field names (if any).
 */
function validateNumericFields(body, numericFields) {
  const invalid = [];
  numericFields.forEach((f) => {
    if (Object.prototype.hasOwnProperty.call(body, f) && body[f] !== null && body[f] !== undefined && body[f] !== '') {
      const v = Number(body[f]);
      if (Number.isNaN(v)) invalid.push(f);
    }
  });
  return invalid;
}

const numericFields = [
  'fastingBS',
  'beforeBreakfastBS',
  'afterBreakfastBS',
  'beforeLunchBS',
  'afterLunchBS',
  'beforeDinnerBS',
  'afterDinnerBS',
  'midnightBS',
  'threeAMBS',
  'breakfastCarbs',
  'lunchCarbs',
  'dinnerCarbs',
  'breakfastInsulin',
  'lunchInsulin',
  'dinnerInsulin',
  'carbCoefficient',
  'mixedUnits',
  'lantusUnits',
  'rapidUnits',
];

module.exports = {
  async createRecord(req, res) {
    try {
      console.log('DEBUG createRecord req.user:', req.user);
      console.log('DEBUG createRecord req.body:', req.body);

      const patientId = req.user && req.user._id;
      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized', error: 'No patient information' });
      }

      const { day } = req.body;
      if (!day) {
        return res.status(400).json({ success: false, message: 'Validation error', error: 'Field "day" is required' });
      }

      const normalizedDay = normalizeDay(day);

      // Validate numeric fields
      const invalid = validateNumericFields(req.body, numericFields);
      if (invalid.length) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: `These fields must be numbers: ${invalid.join(', ')}`,
        });
      }

      // Check for duplicate record for same patient + day
      const existing = await GlucoseRecord.findOne({ patientId, day: normalizedDay });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Record already exists for this day', error: 'duplicate_day' });
      }

      // Build record object, coercing numeric fields to Number where applicable
      const recordData = {
        patientId,
        day: normalizedDay,
        fastingBS: req.body.fastingBS !== undefined ? Number(req.body.fastingBS) : undefined,
        beforeBreakfastBS: req.body.beforeBreakfastBS !== undefined ? Number(req.body.beforeBreakfastBS) : undefined,
        afterBreakfastBS: req.body.afterBreakfastBS !== undefined ? Number(req.body.afterBreakfastBS) : undefined,
        beforeLunchBS: req.body.beforeLunchBS !== undefined ? Number(req.body.beforeLunchBS) : undefined,
        afterLunchBS: req.body.afterLunchBS !== undefined ? Number(req.body.afterLunchBS) : undefined,
        beforeDinnerBS: req.body.beforeDinnerBS !== undefined ? Number(req.body.beforeDinnerBS) : undefined,
        afterDinnerBS: req.body.afterDinnerBS !== undefined ? Number(req.body.afterDinnerBS) : undefined,
        midnightBS: req.body.midnightBS !== undefined ? Number(req.body.midnightBS) : undefined,
        threeAMBS: req.body.threeAMBS !== undefined ? Number(req.body.threeAMBS) : undefined,

        breakfastCarbs: req.body.breakfastCarbs !== undefined ? Number(req.body.breakfastCarbs) : undefined,
        lunchCarbs: req.body.lunchCarbs !== undefined ? Number(req.body.lunchCarbs) : undefined,
        dinnerCarbs: req.body.dinnerCarbs !== undefined ? Number(req.body.dinnerCarbs) : undefined,

        breakfastInsulin: req.body.breakfastInsulin !== undefined ? Number(req.body.breakfastInsulin) : undefined,
        lunchInsulin: req.body.lunchInsulin !== undefined ? Number(req.body.lunchInsulin) : undefined,
        dinnerInsulin: req.body.dinnerInsulin !== undefined ? Number(req.body.dinnerInsulin) : undefined,

        carbCoefficient: req.body.carbCoefficient !== undefined ? Number(req.body.carbCoefficient) : undefined,
        insulinType: req.body.insulinType,
        mixedUnits: req.body.mixedUnits !== undefined ? Number(req.body.mixedUnits) : undefined,

        lantusUnits: req.body.lantusUnits !== undefined ? Number(req.body.lantusUnits) : undefined,
        rapidUnits: req.body.rapidUnits !== undefined ? Number(req.body.rapidUnits) : undefined,

        hadProblem: typeof req.body.hadProblem === 'boolean' ? req.body.hadProblem : (req.body.hadProblem === 'true' || req.body.hadProblem === '1'),
        problemSubject: req.body.problemSubject,
        problemExplain: req.body.problemExplain,
      };

      const record = new GlucoseRecord(recordData);
      const saved = await record.save();

      // Create notification for doctor
      const patient = await User.findById(patientId);
      if (patient && patient.assignedDoctor) {
        // Determine severity based on glucose levels
        let severity = 'normal';
        const glucoseValues = [
          saved.fastingBS, saved.beforeBreakfastBS, saved.afterBreakfastBS,
          saved.beforeLunchBS, saved.afterLunchBS, saved.beforeDinnerBS,
          saved.afterDinnerBS, saved.midnightBS, saved.threeAMBS
        ].filter(v => v !== null && v !== undefined);
        const maxGlucose = Math.max(...glucoseValues);
        const minGlucose = Math.min(...glucoseValues);
        if (maxGlucose > 300) severity = 'critical_high';
        else if (minGlucose < 60) severity = 'risk_low';

        let message = 'New glucose record submitted';
        if (severity === 'critical_high') message = 'Critical high glucose recorded';
        else if (severity === 'risk_low') message = 'Hypoglycemia risk detected';


      }

      return res.status(201).json({ success: true, record: saved });
    } catch (err) {
      console.error('ERROR in createRecord:', err);
      // Handle unique index error explicitly
      if (err && err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Record already exists for this day', error: err.message });
      }
      return res.status(500).json({ success: false, message: 'Failed to create record', error: err.message });
    }
  },

  async getRecords(req, res) {
    try {
      const patientId = req.user && req.user._id;
      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized', error: 'No patient information' });
      }

      const records = await GlucoseRecord.find({ patientId })
        .sort({ day: -1, createdAt: -1 })
        .lean();

      return res.json({ success: true, records });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch records', error: err.message });
    }
  },

  async updateRecord(req, res) {
    try {
      const patientId = req.user && req.user._id;
      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized', error: 'No patient information' });
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid record id', error: 'invalid_id' });
      }

      const record = await GlucoseRecord.findById(id);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Record not found', error: 'not_found' });
      }

      if (!record.patientId.equals(patientId)) {
        return res.status(403).json({ success: false, message: 'Forbidden', error: 'not_owner' });
      }

      // If day provided in update, normalize and check duplication
      if (req.body.day) {
        const normalizedDay = normalizeDay(req.body.day);
        // If changing day to a date that another record already uses, prevent duplication
        const duplicate = await GlucoseRecord.findOne({ patientId, day: normalizedDay, _id: { $ne: record._id } });
        if (duplicate) {
          return res.status(409).json({ success: false, message: 'Another record already exists for this day', error: 'duplicate_day' });
        }
        record.day = normalizedDay;
      }

      // Validate numeric fields in body
      const invalid = validateNumericFields(req.body, numericFields);
      if (invalid.length) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: `These fields must be numbers: ${invalid.join(', ')}`,
        });
      }

      // Update allowed fields (coerce numbers where expected)
      numericFields.forEach((f) => {
        if (Object.prototype.hasOwnProperty.call(req.body, f)) {
          record[f] = req.body[f] === '' || req.body[f] === null ? undefined : Number(req.body[f]);
        }
      });

      // String/boolean fields
      if (Object.prototype.hasOwnProperty.call(req.body, 'insulinType')) record.insulinType = req.body.insulinType;
      if (Object.prototype.hasOwnProperty.call(req.body, 'hadProblem')) {
        record.hadProblem = typeof req.body.hadProblem === 'boolean' ? req.body.hadProblem : (req.body.hadProblem === 'true' || req.body.hadProblem === '1');
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'problemSubject')) record.problemSubject = req.body.problemSubject;
      if (Object.prototype.hasOwnProperty.call(req.body, 'problemExplain')) record.problemExplain = req.body.problemExplain;

      const updated = await record.save();

      return res.json({ success: true, updatedRecord: updated });
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Duplicate record', error: err.message });
      }
      return res.status(500).json({ success: false, message: 'Failed to update record', error: err.message });
    }
  },

  async deleteRecord(req, res) {
    try {
      const patientId = req.user && req.user._id;
      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized', error: 'No patient information' });
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid record id', error: 'invalid_id' });
      }

      const record = await GlucoseRecord.findById(id);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Record not found', error: 'not_found' });
      }

      if (!record.patientId.equals(patientId)) {
        return res.status(403).json({ success: false, message: 'Forbidden', error: 'not_owner' });
      }

      await GlucoseRecord.deleteOne({ _id: id });

      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete record', error: err.message });
    }
  },
};