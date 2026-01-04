// Return QR code data URL and code for a prescription
const Prescription = require('../models/Prescription');
const QRCode = require('qrcode');

// GET /api/patient/prescriptions/:id/qr
async function getPrescriptionQR(req, res) {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    if (!prescription.verificationCode) return res.status(400).json({ error: 'No verification code' });
    const qrDataUrl = await QRCode.toDataURL(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-prescription.html?code=${prescription.verificationCode}`
    );
    res.json({ code: prescription.verificationCode, qrDataUrl });
  } catch (err) {
    console.error('getPrescriptionQR error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getPrescriptionQR };