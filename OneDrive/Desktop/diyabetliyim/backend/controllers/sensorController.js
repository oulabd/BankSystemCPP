const SensorReading = require('../models/SensorReading');
const User = require('../models/User');

// Public or device endpoint to post readings
async function postReading(req, res) {
  const { patientId, glucose, unit, recordedAt } = req.body;
  if (!patientId || glucose == null) return res.status(400).json({ message: 'patientId and glucose required' });
  try {
    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const reading = await SensorReading.create({ patient: patientId, glucose, unit, recordedAt });
    return res.status(201).json({ message: 'Reading stored', reading });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Patient endpoint: latest reading
async function getLatestForPatient(req, res) {
  try {
    const patientId = req.user._id;
    const reading = await SensorReading.findOne({ patient: patientId }).sort({ recordedAt: -1 });
    if (!reading) return res.status(404).json({ message: 'No readings found' });
    return res.json({ reading });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { postReading, getLatestForPatient };
