// DELETE /api/doctor/review/:reviewId
const DoctorReview = require('../models/DoctorReview');

async function deleteDoctorReview(req, res) {
  const { reviewId } = req.params;
  try {
    const review = await DoctorReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'المراجعة غير موجودة' });
    }
    // Optionally, check if req.user.id === review.doctor.toString() for security
    await review.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'فشل حذف المراجعة' });
  }
}

module.exports = deleteDoctorReview;
