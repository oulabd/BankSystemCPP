// ملف مؤقت لـ notificationController.js
// دالة وهمية لتشغيل الخادم بدون منطق إشعارات فعلي.

exports.sendNotification = async function (userId, message, type, refId) {
  // في بيئة الإنتاج، نفّذ منطق الإشعارات الحقيقي هنا.
  console.log(`[إشعار] إلى: ${userId}, النوع: ${type}, المرجع: ${refId}, الرسالة: ${message}`);
  return Promise.resolve();
};
