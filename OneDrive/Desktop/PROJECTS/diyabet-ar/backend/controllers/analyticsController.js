const DailyRecord = require('../models/DailyRecord');
const MedicationRecord = require('../models/MedicationRecord');
const User = require('../models/User');
const mongoose = require('mongoose');
// Supplementary models/services reused for doctor actions
const Prescription = require('../models/Prescription');
const LabRequest = require('../models/LabRequest');
const Appointment = require('../models/Appointment');
const MedicalLog = require('../models/MedicalLog');

// GET /api/analytics/glucose/weekly
async function getWeeklyGlucose(req, res) {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.query.patientId;
    
    if (req.user.role === 'doctor' && req.query.patientId) {
      const patient = await User.findById(req.query.patientId);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'محظور' });
      }
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyData = await DailyRecord.aggregate([
      {
        $match: {
          patient: new mongoose.Types.ObjectId(patientId),
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          avgGlucose: { $avg: '$value' },
          minGlucose: { $min: '$value' },
          maxGlucose: { $max: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const overallAvg = weeklyData.reduce((sum, day) => sum + day.avgGlucose, 0) / (weeklyData.length || 1);
    
    res.json({
      weekly: {
        average: Math.round(overallAvg),
        days: weeklyData,
        period: { start: sevenDaysAgo, end: new Date() }
      }
    });
  } catch (err) {
    console.error('getWeeklyGlucose error:', err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
}

// GET /api/analytics/glucose/monthly
async function getMonthlyGlucose(req, res) {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.query.patientId;
    
    if (req.user.role === 'doctor' && req.query.patientId) {
      const patient = await User.findById(req.query.patientId);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyData = await DailyRecord.aggregate([
      {
        $match: {
          patient: new mongoose.Types.ObjectId(patientId),
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          avgGlucose: { $avg: '$value' },
          minGlucose: { $min: '$value' },
          maxGlucose: { $max: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const weeklyBreakdown = await DailyRecord.aggregate([
      {
        $match: {
          patient: new mongoose.Types.ObjectId(patientId),
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $week: '$date' },
          avgGlucose: { $avg: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const overallAvg = monthlyData.reduce((sum, day) => sum + day.avgGlucose, 0) / (monthlyData.length || 1);
    
    res.json({
      monthly: {
        average: Math.round(overallAvg),
        days: monthlyData,
        weeklyBreakdown,
        period: { start: thirtyDaysAgo, end: new Date() }
      }
    });
  } catch (err) {
    console.error('getMonthlyGlucose error:', err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
}

// GET /api/analytics/glucose/trends
async function getGlucoseTrends(req, res) {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.query.patientId;
    
    if (req.user.role === 'doctor' && req.query.patientId) {
      const patient = await User.findById(req.query.patientId);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'محظور' });
      }
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const records = await DailyRecord.find({
      patient: patientId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });
    
    const riskFlags = [];
    const trends = {
      morningHighs: 0,
      morningLows: 0,
      afternoonHighs: 0,
      eveningHighs: 0,
      postMealPeaks: 0,
      nightLows: 0,
      overallHigh: 0,
      overallLow: 0,
      normalReadings: 0
    };
    
    records.forEach(record => {
      const hour = new Date(record.date).getHours();
      
      if (hour >= 6 && hour < 10) {
        if (record.value > 180) trends.morningHighs++;
        if (record.value < 70) trends.morningLows++;
      }
      
      if (hour >= 12 && hour < 16) {
        if (record.value > 180) trends.afternoonHighs++;
      }
      
      if (hour >= 18 && hour < 22) {
        if (record.value > 180) trends.eveningHighs++;
      }
      
      if (hour >= 22 || hour < 6) {
        if (record.value < 70) trends.nightLows++;
      }
      
      if (record.value >= 300) trends.overallHigh++;
      else if (record.value <= 60) trends.overallLow++;
      else if (record.value >= 80 && record.value <= 180) trends.normalReadings++;
    });
    
    if (trends.morningHighs > 5) riskFlags.push('morning_peaks');
    if (trends.morningLows > 3) riskFlags.push('morning_lows');
    if (trends.nightLows > 3) riskFlags.push('night_hypoglycemia');
    if (trends.overallHigh > 10) riskFlags.push('frequent_highs');
    if (trends.overallLow > 5) riskFlags.push('frequent_lows');
    if (trends.afternoonHighs > 5) riskFlags.push('post_meal_peaks');
    
    const totalReadings = records.length;
    const timeInRange = {
      veryLow: (records.filter(r => r.value < 70).length / totalReadings * 100).toFixed(1),
      low: (records.filter(r => r.value >= 70 && r.value < 80).length / totalReadings * 100).toFixed(1),
      target: (records.filter(r => r.value >= 80 && r.value <= 180).length / totalReadings * 100).toFixed(1),
      high: (records.filter(r => r.value > 180 && r.value < 250).length / totalReadings * 100).toFixed(1),
      veryHigh: (records.filter(r => r.value >= 250).length / totalReadings * 100).toFixed(1)
    };
    
    res.json({
      trends,
      riskFlags,
      timeInRange,
      totalReadings,
      recommendations: generateRecommendations(trends, riskFlags)
    });
  } catch (err) {
    console.error('getGlucoseTrends error:', err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
}

// GET /api/analytics/glucose/insulin-impact
async function getInsulinImpact(req, res) {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.query.patientId;
    
    if (req.user.role === 'doctor' && req.query.patientId) {
      const patient = await User.findById(req.query.patientId);
      if (!patient || patient.assignedDoctor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'محظور' });
      }
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const insulinDoses = await MedicationRecord.find({
      patient: patientId,
      medicationType: 'insulin',
      recordedAt: { $gte: thirtyDaysAgo }
    }).sort({ recordedAt: 1 });
    
    const glucoseRecords = await DailyRecord.find({
      patient: patientId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });
    
    const impacts = [];
    const controlFlags = [];
    
    insulinDoses.forEach(dose => {
      const doseTime = new Date(dose.recordedAt);
      
      const beforeReading = glucoseRecords.find(r => {
        const diff = doseTime - new Date(r.date);
        return diff > 0 && diff <= 30 * 60 * 1000;
      });
      
      const afterReading = glucoseRecords.find(r => {
        const diff = new Date(r.date) - doseTime;
        return diff >= 60 * 60 * 1000 && diff <= 3 * 60 * 60 * 1000;
      });
      
      if (beforeReading && afterReading) {
        const drop = beforeReading.value - afterReading.value;
        const dropPerUnit = drop / dose.dose;
        
        let effectivenessFlag;
        if (dropPerUnit < 20) {
          effectivenessFlag = 'insufficient_dose';
          controlFlags.push('insufficient_dose');
        } else if (dropPerUnit > 50) {
          effectivenessFlag = 'possible_over_dose';
          controlFlags.push('possible_over_dose');
        } else {
          effectivenessFlag = 'good_control';
        }
        
        impacts.push({
          date: dose.recordedAt,
          insulinDose: dose.dose,
          unit: dose.unit,
          glucoseBefore: beforeReading.value,
          glucoseAfter: afterReading.value,
          drop,
          dropPerUnit: Math.round(dropPerUnit),
          effectiveness: effectivenessFlag,
          insulinName: dose.name
        });
      }
    });
    
    const avgDoseResponse = impacts.length > 0
      ? impacts.reduce((sum, i) => sum + i.dropPerUnit, 0) / impacts.length
      : 0;
    
    const flagCounts = {
      insufficient_dose: controlFlags.filter(f => f === 'insufficient_dose').length,
      possible_over_dose: controlFlags.filter(f => f === 'possible_over_dose').length,
      good_control: controlFlags.filter(f => f === 'good_control').length
    };
    
    const overallControl = flagCounts.good_control > flagCounts.insufficient_dose + flagCounts.possible_over_dose
      ? 'good_control'
      : flagCounts.insufficient_dose > flagCounts.possible_over_dose
      ? 'needs_increase'
      : 'needs_decrease';
    
    res.json({
      insulinImpact: {
        impacts,
        avgDoseResponse: Math.round(avgDoseResponse),
        flagCounts,
        overallControl,
        totalAnalyzed: impacts.length,
        recommendations: generateInsulinRecommendations(overallControl, avgDoseResponse)
      }
    });
  } catch (err) {
    console.error('getInsulinImpact error:', err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
}

function generateRecommendations(trends, riskFlags) {
  const recommendations = [];
  
  if (riskFlags.includes('morning_peaks')) {
    recommendations.push({
      type: 'warning',
      message: 'تم اكتشاف ارتفاعات مستمرة في الصباح. الرجاء النظر في تعديل الأنسولين المسائي أو تقليل الوجبات الخفيفة قبل النوم.',
      action: 'استشر طبيبك بخصوص تعديل الأنسولين الأساسي.'
    });
  }
  
  if (riskFlags.includes('night_hypoglycemia')) {
    recommendations.push({
      type: 'danger',
      message: 'تم اكتشاف انخفاض سكر الدم ليلاً. هذا يمكن أن يكون خطيراً.',
      action: 'قلل جرعة الأنسولين المسائي وتناول وجبة خفيفة قبل النوم. اتصل بطبيبك على الفور.'
    });
  }
  
  if (riskFlags.includes('frequent_highs')) {
    recommendations.push({
      type: 'warning',
      message: 'تم اكتشاف قراءات مرتفعة متكررة.',
      action: 'راجع خطة الطعام وجرعات الأنسولين مع طبيبك.'
    });
  }
  
  if (riskFlags.includes('post_meal_peaks')) {
    recommendations.push({
      type: 'info',
      message: 'تم اكتشاف ارتفاعات بعد الطعام.',
      action: 'الرجاء النظر في أخذ الأنسولين السريع المفعول 15-20 دقيقة قبل الطعام.'
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'مستويات الجلوكوز لديك مضبوطة بشكل جيد!',
      action: 'استمر على هذا النحو واحافظ على روتينك الحالي.'
    });
  }
  
  return recommendations;
}

function generateInsulinRecommendations(overallControl, avgDoseResponse) {
  const recommendations = [];
  
  if (overallControl === 'needs_increase') {
    recommendations.push({
      type: 'warning',
      message: 'قد تكون جرعات الأنسولين لديك غير كافية.',
      action: 'استشر طبيبك بخصوص زيادة جرعات الأنسولين. متوسط استجابة أقل من الهدف.',
      metric: `Average drop per unit: ${Math.round(avgDoseResponse)} mg/dL (الهدف: 30-50 mg/dL)`
    });
  } else if (overallControl === 'needs_decrease') {
    recommendations.push({
      type: 'danger',
      message: 'قد تكون جرعات الأنسولين عالية جداً، مع خطر انخفاض سكر الدم.',
      action: 'اتصل بطبيبك على الفور لمراجعة جرعات الأنسولين.',
      metric: `Average drop per unit: ${Math.round(avgDoseResponse)} mg/dL (الهدف: 30-50 mg/dL)`
    });
  } else {
    recommendations.push({
      type: 'success',
      message: 'تم معايرة جرعات الأنسولين بشكل جيد.',
      action: 'استمر على مراقبة واحافظ على النظام الحالي.',
      metric: `Average drop per unit: ${Math.round(avgDoseResponse)} mg/dL (الهدف: 30-50 mg/dL)`
    });
  }
  
  return recommendations;
}

// Helper: ensure doctor is assigned to patient
async function assertDoctorAssigned(doctorId, patientId) {
  const patient = await User.findById(patientId).select('assignedDoctor fullName');
  if (!patient || !patient.assignedDoctor || patient.assignedDoctor.toString() !== doctorId) {
    const err = new Error('محظور');
    err.status = 403;
    throw err;
  }
  return patient;
}

// POST /api/doctor/note
async function addDoctorNote(req, res) {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'محظور' });
    const { patientId, noteText } = req.body;
    if (!patientId || !noteText) return res.status(400).json({ error: 'معرّف المريض ونص الالذاثر مطلوبان' });

    const patient = await assertDoctorAssigned(req.user.id, patientId);

    const note = await MedicalLog.create({
      patientId,
      doctorId: req.user.id,
      type: 'note',
      description: noteText
    });

    await createNotification({
      user: patientId,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.COMMENT,
      message: 'Patient received new doctor\'s update',
      link: `/patient/dashboard.html`,
      meta: { kind: 'note', noteId: note._id }
    });

    res.json({ success: true, note });
  } catch (err) {
    console.error('addDoctorNote error:', err);
    res.status(err.status || 500).json({ error: err.status ? 'محظور' : 'خطأ في الخادم' });
  }
}

// POST /api/doctor/prescription
async function createDoctorPrescription(req, res) {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'محظور' });
    const { patientId, insulinType, dosage, deviceType, startDate, endDate, notes } = req.body;
    if (!patientId || (!insulinType && !deviceType) || !dosage) {
      return res.status(400).json({ error: 'معرّف المريض، (نوع الأنسولين أو نوع الجهاز) والجرعة مطلوبة' });
    }

    const patient = await assertDoctorAssigned(req.user.id, patientId);

    // Map to existing Prescription schema (items[])
    const items = [{
      name: insulinType || deviceType,
      dose: dosage,
      frequency: startDate && endDate ? `from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}` : 'as directed',
      type: insulinType ? 'insulin' : 'device'
    }];

    const verifyCode = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user.id,
      items,
      notes,
      verifyCode
    });

    await createNotification({
      user: patientId,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.PRESCRIPTION_NEW,
      message: 'Patient received new doctor\'s update',
      link: `/patient/prescriptions.html?prescription=${prescription._id}`,
      meta: { kind: 'prescription', prescriptionId: prescription._id }
    });

    res.json({ success: true, prescription });
  } catch (err) {
    console.error('createDoctorPrescription error:', err);
    res.status(err.status || 500).json({ error: err.status ? 'محظور' : 'خطأ في الخادم' });
  }
}

// POST /api/doctor/lab-request
async function requestLabTest(req, res) {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'محظور' });
    const { patientId, testType, instructions } = req.body;
    if (!patientId || !testType) {
      return res.status(400).json({ error: 'معرّف المريض ونوع الاختبار مطلوبان' });
    }

    const patient = await assertDoctorAssigned(req.user.id, patientId);

    const lab = await LabRequest.create({
      patient: patientId,
      doctor: req.user.id,
      testName: testType,
      doctorComment: instructions,
      status: 'requested',
      requestedAt: new Date()
    });

    await createNotification({
      user: patientId,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.LAB_REQUEST,
      message: 'Patient received new doctor\'s update',
      link: `/patient/labs.html?request=${lab._id}`,
      meta: { kind: 'lab', labRequestId: lab._id }
    });

    res.json({ success: true, labRequest: lab });
  } catch (err) {
    console.error('requestLabTest error:', err);
    res.status(err.status || 500).json({ error: err.status ? 'محظور' : 'خطأ في الخادم' });
  }
}

// PUT /api/doctor/appointment/:id
async function updateDoctorAppointmentStatus(req, res) {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'محظور' });
    const { id } = req.params;
    const { status, comment } = req.body;

    const ap = await Appointment.findById(id);
    if (!ap) return res.status(404).json({ error: 'لم يتم العثور على الموعد' });

    await assertDoctorAssigned(req.user.id, ap.patient);

    if (!['pending', 'approved', 'rejected', 'rescheduled'].includes(status)) {
      return res.status(400).json({ error: 'الحالة غير صحيحة' });
    }

    ap.status = status;
    if (comment !== undefined) ap.messageFromDoctor = comment;
    await ap.save();

    await createNotification({
      user: ap.patient,
      sender: req.user._id,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      message: 'Patient received new doctor\'s update',
      link: `/patient/appointments.html?id=${ap._id}`,
      meta: { kind: 'appointment', appointmentId: ap._id }
    });

    res.json({ success: true, appointment: ap });
  } catch (err) {
    console.error('updateDoctorAppointmentStatus error:', err);
    res.status(err.status || 500).json({ error: err.status ? 'محظور' : 'خطأ في الخادم' });
  }
}

module.exports = {
  getWeeklyGlucose,
  getMonthlyGlucose,
  getGlucoseTrends,
  getInsulinImpact,
  // new doctor actions
  addDoctorNote,
  createDoctorPrescription,
  requestLabTest,
  updateDoctorAppointmentStatus
};
