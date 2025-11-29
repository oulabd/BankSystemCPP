const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DoctorReviewSchema = new Schema({
  doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  record: { type: Schema.Types.ObjectId, ref: 'DailyRecord', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DoctorReview', DoctorReviewSchema);
