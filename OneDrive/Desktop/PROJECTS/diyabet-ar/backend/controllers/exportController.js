const PDFDocument = require('pdfkit');
const User = require('../models/User');
const DailyRecord = require('../models/DailyRecord');
const Prescription = require('../models/Prescription');
const LabRequest = require('../models/LabRequest');
const Appointment = require('../models/Appointment');

// GET /api/patient/:id/export
async function exportPatientReport(req, res) {
  try {
    const patientId = req.params.id;
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'المريض غير موجود' });
    }
    // Decrypt patient data if needed
    const patientData = patient.getDecryptedData ? patient.getDecryptedData() : patient;

    // Fetch related data
    const [dailyRecords, prescriptions, labRequests, appointments] = await Promise.all([
      DailyRecord.find({ patient: patientId }).sort({ date: -1 }).limit(10),
      Prescription.find({ patient: patientId }).sort({ createdAt: -1 }).limit(5),
      LabRequest.find({ patient: patientId }).sort({ createdAt: -1 }).limit(5),
      Appointment.find({ patient: patientId }).sort({ date: -1 }).limit(5),
    ]);

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=patient_report_${patientId}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('تقرير المريض', { align: 'center' });
    doc.moveDown();

    // Patient Info
    doc.fontSize(14).text(`الاسم الكامل: ${patientData.fullName || ''}`);
    doc.text(`رقم الهوية: ${patientData.identityNumber || ''}`);
    doc.text(`تاريخ الميلاد: ${patientData.birthdate ? new Date(patientData.birthdate).toLocaleDateString('ar-SA') : ''}`);
    doc.text(`الهاتف: ${patientData.phone || ''}`);
    doc.text(`العنوان: ${patientData.address || ''}`);
    doc.moveDown();

    // Daily Records
    doc.fontSize(16).text('آخر السجلات', { underline: true });
    dailyRecords.forEach((rec, i) => {
      doc.fontSize(12).text(`${i + 1}. التاريخ: ${rec.date ? new Date(rec.date).toLocaleDateString('ar-SA') : ''}, سكر الدم: ${rec.glucose || '-'} mg/dL، ملاحظة: ${rec.note || '-'}`);
    });
    doc.moveDown();

    // Prescriptions
    doc.fontSize(16).text('آخر الوصفات', { underline: true });
    prescriptions.forEach((rx, i) => {
      doc.fontSize(12).text(`${i + 1}. التاريخ: ${rx.createdAt ? new Date(rx.createdAt).toLocaleDateString('ar-SA') : ''}, الأدوية: ${rx.medications ? rx.medications.join(', ') : '-'}`);
    });
    doc.moveDown();

    // Lab Requests
    doc.fontSize(16).text('أحدث طلبات المختبر', { underline: true });
    labRequests.forEach((lab, i) => {
      doc.fontSize(12).text(`${i + 1}. التاريخ: ${lab.createdAt ? new Date(lab.createdAt).toLocaleDateString('ar-SA') : ''}, الفحوصات: ${lab.tests ? lab.tests.join(', ') : '-'}`);
    });
    doc.moveDown();

    // Appointments
    doc.fontSize(16).text('آخر المواعيد', { underline: true });
    appointments.forEach((appt, i) => {
      doc.fontSize(12).text(`${i + 1}. التاريخ: ${appt.date ? new Date(appt.date).toLocaleDateString('ar-SA') : ''}, الطبيب: ${appt.doctorName || '-'}, ملاحظة: ${appt.note || '-'}`);
    });

    doc.end();
  } catch (err) {
    console.error('خطأ في exportPatientReport:', err);
    res.status(500).json({ error: 'تعذر إنشاء التقرير.' });
  }
}

module.exports = { exportPatientReport };