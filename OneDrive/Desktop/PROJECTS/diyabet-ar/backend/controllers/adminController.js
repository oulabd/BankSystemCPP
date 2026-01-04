const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/admin/doctors - List all doctors
async function getDoctors(req, res) {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Decrypt sensitive fields for display
    const decryptedDoctors = doctors.map(doctor => doctor.getDecryptedData());
    
    return res.json({ doctors: decryptedDoctors });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// POST /api/admin/doctors - Create new doctor
async function createDoctor(req, res) {
  try {
    const { fullName, name, email, phone, password, identityNumber, nationalId } = req.body;
    
    // Use fullName or fallback to name for compatibility
    const doctorName = fullName || name;
    const doctorIdentity = identityNumber || nationalId;
    
    if (!doctorName || !email || !password || !doctorIdentity) {
      return res.status(400).json({ message: 'Name, email, identity number, and password are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { identityNumber: doctorIdentity }] });
    if (existing) {
      return res.status(400).json({ message: 'Email or identity number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const doctor = await User.create({
      fullName: doctorName,
      email,
      phone,
      identityNumber: doctorIdentity,
      password: hashedPassword,
      role: 'doctor',
      isActive: true,
      isVerified: true
    });

    const doctorData = doctor.toObject();
    delete doctorData.password;

    return res.status(201).json({ message: 'Doctor created successfully', doctor: doctorData });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// PUT /api/admin/doctors/:id - Update doctor
async function updateDoctor(req, res) {
  try {
    const { id } = req.params;
    const { fullName, name, email, phone, identityNumber, nationalId } = req.body;
    
    const doctor = await User.findOne({ _id: id, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (email && email !== doctor.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update fields - support both old and new field names
    if (fullName || name) doctor.fullName = fullName || name;
    if (email) doctor.email = email;
    if (phone) doctor.phone = phone;
    if (identityNumber || nationalId) doctor.identityNumber = identityNumber || nationalId;

    await doctor.save();

    const doctorData = doctor.getDecryptedData();
    delete doctorData.password;

    return res.json({ message: 'Doctor updated successfully', doctor: doctorData });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// DELETE /api/admin/doctors/:id - Remove doctor
async function deleteDoctor(req, res) {
  try {
    const { id } = req.params;
    
    const doctor = await User.findOneAndDelete({ _id: id, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Unassign patients
    await User.updateMany(
      { assignedDoctor: id },
      { $set: { assignedDoctor: null } }
    );

    return res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// GET /api/admin/patients - List all patients
async function getPatients(req, res) {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('-password')
      .populate('assignedDoctor', 'name email')
      .sort({ createdAt: -1 });
    return res.json({ patients });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// PUT /api/admin/patient/assign - Assign patient to doctor
async function assignPatient(req, res) {
  try {
    const { patientId, doctorId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (doctorId) {
      const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      patient.assignedDoctor = doctorId;
    } else {
      patient.assignedDoctor = null;
    }

    await patient.save();

    return res.json({ message: 'Patient assignment updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// GET /api/admin/users - List all users
async function getUsers(req, res) {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// PUT /api/admin/user/:id - Activate/deactivate user
async function toggleUser(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    return res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// DELETE /api/admin/user/:id - Delete user
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If deleting a doctor, unassign patients
    if (user.role === 'doctor') {
      await User.updateMany(
        { assignedDoctor: id },
        { $set: { assignedDoctor: null } }
      );
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getPatients,
  assignPatient,
  getUsers,
  toggleUser,
  deleteUser
};