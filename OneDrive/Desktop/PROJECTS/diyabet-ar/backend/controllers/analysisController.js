// controllers/analysisController.js
const { sendNotification } = require('../controllers/notificationController');


// After saving result
const result = await AnalysisResult.create({ /* ...fields... */ });
await sendNotification(
  result.patientId,
  "Your new analysis results are available",
  "analysis",
  result._id
);

