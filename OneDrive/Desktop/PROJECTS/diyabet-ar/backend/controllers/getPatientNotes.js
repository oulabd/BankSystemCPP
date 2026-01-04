// GET /api/doctor/patient/:id/notes
const MedicalLog = require('../models/MedicalLog');

async function getPatientNotes(req, res) {
  const { id } = req.params;
  try {
    // Fetch notes from MedicalLog
    const notes = await MedicalLog.find({
      patientId: id,
      type: { $in: ['comment', 'note'] }
    })
      .populate('doctorId', 'fullName')
      .sort({ createdAt: -1 });

    // Fetch notes from DoctorReview (comments on DailyRecord)
    const DoctorReview = require('../models/DoctorReview');
    const DailyRecord = require('../models/DailyRecord');
    // Find all DailyRecords for this patient
    const dailyRecords = await DailyRecord.find({ patientId: id }).select('_id day');
    const recordIdToDay = {};
    dailyRecords.forEach(r => { recordIdToDay[r._id.toString()] = r.day; });
    const reviews = await DoctorReview.find({ record: { $in: dailyRecords.map(r => r._id) } })
      .populate('doctor', 'fullName')
      .sort({ createdAt: -1 });

    // Format for frontend compatibility
    const formatted = notes.map(n => ({
      _id: n._id,
      text: n.description,
      doctor: n.doctorId ? { fullName: n.doctorId.fullName } : undefined,
      createdAt: n.createdAt,
      record: n.recordId ? { day: n.createdAt } : undefined // fallback
    }));
    const formattedReviews = reviews.map(r => ({
      _id: r._id,
      text: r.text,
      doctor: r.doctor ? { fullName: r.doctor.fullName } : undefined,
      createdAt: r.createdAt,
      record: { day: recordIdToDay[r.record.toString()] || r.createdAt }
    }));
    // Merge and sort by date descending
    const allNotes = [...formatted, ...formattedReviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(allNotes);
  } catch (err) {
    res.status(500).json({ error: 'فشل في جلب ملاحظات الطبيب' });
  }
}

module.exports = getPatientNotes;
