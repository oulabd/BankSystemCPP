const LabTest = require('../models/LabTest');
const User = require('../models/User');
const mongoose = require('mongoose');

function getUserId(req) {
  return (req.user && (req.user._id || req.user.id)) || null;
}

function checkCriticalFlag(testType, resultValue) {
  if (!testType || !resultValue) return null;
  const t = testType.toLowerCase();
  const num = Number(resultValue);
  if (t === 'hba1c' && !Number.isNaN(num)) {
    if (num >= 9) return 'high_hba1c';
    if (num <= 5) return 'low_hba1c';
  }
  return null;
}

exports.createLabTest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = req.user && req.user.role;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!['doctor', 'admin'].includes(role)) return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });

    const {
      patientId,
      testType,
      testName,
      resultValue,
      resultUnit,
      referenceRange,
      notes,
      takenAt,
      status,
      isVisibleToPatient,
    } = req.body;

    if (!patientId) return res.status(400).json({ success: false, message: 'Validation error', error: 'patientId is required' });
    if (!testType) return res.status(400).json({ success: false, message: 'Validation error', error: 'testType is required' });
    if (!testName) return res.status(400).json({ success: false, message: 'Validation error', error: 'testName is required' });
    if (!takenAt) return res.status(400).json({ success: false, message: 'Validation error', error: 'takenAt is required' });

    if (!mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid patientId' });

    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Validation error', error: 'Patient not found' });

    const taken = new Date(takenAt);
    if (isNaN(taken.getTime())) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid takenAt' });

    const lab = new LabTest({
      patientId,
      doctorId: userId,
      testType,
      testName,
      resultValue: resultValue !== undefined ? String(resultValue) : undefined,
      resultUnit,
      referenceRange,
      notes,
      takenAt: taken,
      status: status || 'completed',
      isVisibleToPatient: isVisibleToPatient !== undefined ? !!isVisibleToPatient : true,
    });

    if (req.file) {
      // multer typically provides path and filename
      lab.fileUrl = req.file.path || (`/uploads/labs/${req.file.filename}`);
    }

    await lab.save();

    const criticalFlag = checkCriticalFlag(testType, Number(resultValue));

    const responseData = { labTest: lab };
    if (criticalFlag) responseData.criticalFlag = criticalFlag;

    return res.status(201).json({ success: true, message: 'Lab test created', data: responseData });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error creating lab test', error: err.message });
  }
};

exports.uploadLabFile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = req.user && req.user.role;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!['doctor', 'admin'].includes(role)) return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid id' });

    const lab = await LabTest.findById(id);
    if (!lab) return res.status(404).json({ success: false, message: 'Lab test not found' });

    // only creator doctor or admin can attach files
    if (role === 'doctor' && lab.doctorId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });
    }

    if (!req.file) return res.status(400).json({ success: false, message: 'Validation error', error: 'No file uploaded' });

    lab.fileUrl = req.file.path || (`/uploads/labs/${req.file.filename}`);
    await lab.save();

    return res.json({ success: true, message: 'File uploaded', data: lab });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error uploading file', error: err.message });
  }
};

exports.getMyLabTests = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = req.user && req.user.role;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (role !== 'patient') return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });

    const { from, to, type } = req.query;
    const q = { patientId: userId, isVisibleToPatient: true };

    if (type) {
      q.$or = [{ testType: type }, { testName: type }];
    }

    if (from || to) {
      q.takenAt = {};
      if (from) {
        const f = new Date(from);
        if (isNaN(f.getTime())) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid from date' });
        q.takenAt.$gte = f;
      }
      if (to) {
        const t = new Date(to);
        if (isNaN(t.getTime())) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid to date' });
        q.takenAt.$lte = t;
      }
    }

    const tests = await LabTest.find(q).sort({ takenAt: -1 });
    return res.json({ success: true, message: 'Lab tests fetched', data: tests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching lab tests', error: err.message });
  }
};

exports.getPatientLabTests = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = req.user && req.user.role;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!['doctor', 'admin'].includes(role)) return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });

    const patientId = req.params.patientId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(patientId)) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid patient id' });

    const { from, to, type } = req.query;
    const q = { patientId };

    if (role === 'doctor') q.doctorId = userId; // doctor sees only their own uploaded tests

    if (type) q.$or = [{ testType: type }, { testName: type }];

    if (from || to) {
      q.takenAt = {};
      if (from) {
        const f = new Date(from);
        if (isNaN(f.getTime())) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid from date' });
        q.takenAt.$gte = f;
      }
      if (to) {
        const t = new Date(to);
        if (isNaN(t.getTime())) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid to date' });
        q.takenAt.$lte = t;
      }
    }

    const tests = await LabTest.find(q).sort({ takenAt: -1 });
    return res.json({ success: true, message: 'Patient lab tests fetched', data: tests });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching patient lab tests', error: err.message });
  }
};

exports.updateLabTest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = req.user && req.user.role;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!['doctor', 'admin'].includes(role)) return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid id' });

    const lab = await LabTest.findById(id);
    if (!lab) return res.status(404).json({ success: false, message: 'Lab test not found' });

    if (role === 'doctor' && lab.doctorId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });
    }

    const updatable = ['testType', 'testName', 'resultValue', 'resultUnit', 'referenceRange', 'notes', 'status', 'takenAt', 'isVisibleToPatient'];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'takenAt') {
          const d = new Date(req.body[field]);
          if (isNaN(d.getTime())) throw new Error('Invalid takenAt');
          lab[field] = d;
        } else if (field === 'resultValue') {
          lab[field] = String(req.body[field]);
        } else if (field === 'isVisibleToPatient') {
          lab[field] = !!req.body[field];
        } else {
          lab[field] = req.body[field];
        }
      }
    });

    if (req.file) {
      lab.fileUrl = req.file.path || (`/uploads/labs/${req.file.filename}`);
    }

    await lab.save();

    const criticalFlag = checkCriticalFlag(lab.testType, Number(lab.resultValue));
    const responseData = { labTest: lab };
    if (criticalFlag) responseData.criticalFlag = criticalFlag;

    return res.json({ success: true, message: 'Lab test updated', data: responseData });
  } catch (err) {
    if (err.message && err.message.startsWith('Invalid')) return res.status(400).json({ success: false, message: 'Validation error', error: err.message });
    return res.status(500).json({ success: false, message: 'Error updating lab test', error: err.message });
  }
};

exports.deleteLabTest = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = req.user && req.user.role;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid id' });

    const lab = await LabTest.findById(id);
    if (!lab) return res.status(404).json({ success: false, message: 'Lab test not found' });

    await LabTest.deleteOne({ _id: id });
    return res.json({ success: true, message: 'Lab test deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting lab test', error: err.message });
  }
};

exports.getLabTestDetail = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = req.user && req.user.role;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Validation error', error: 'Invalid id' });

    const lab = await LabTest.findById(id);
    if (!lab) return res.status(404).json({ success: false, message: 'Lab test not found' });

    if (role === 'patient' && lab.patientId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });
    }

    if (role === 'doctor' && lab.doctorId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden', error: 'Not allowed' });
    }

    return res.json({ success: true, message: 'Lab test fetched', data: lab });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching lab test', error: err.message });
  }
};

