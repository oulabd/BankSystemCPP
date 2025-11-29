const User = require('../models/User');

// GET /api/admin/doctors/pending
async function getPendingDoctors(req, res) {
  try {
    const pendingDoctors = await User.find({ role: 'doctor', isApproved: false }).select('fullName email identityNumber');
    res.json(pendingDoctors);
  } catch (err) {
    console.error('getPendingDoctors error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// PUT /api/admin/doctors/:id/approve
async function approveDoctor(req, res) {
  try {
    const { id } = req.params;
    const doctor = await User.findById(id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    doctor.isApproved = true;
    await doctor.save();
    res.json({ message: 'Doctor approved successfully' });
  } catch (err) {
    console.error('approveDoctor error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// PUT /api/admin/doctors/:id/reject
async function rejectDoctor(req, res) {
  try {
    const { id } = req.params;
    const doctor = await User.findById(id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    await User.findByIdAndDelete(id);
    res.json({ message: 'Doctor rejected and removed' });
  } catch (err) {
    console.error('rejectDoctor error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor
};