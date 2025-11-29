// controllers/questionController.js
const { sendNotification } = require('../controllers/notificationController');

// ...existing code...

// After saving reply
const question = await Question.findByIdAndUpdate(/* ... */);
await sendNotification(
  question.patientId,
  "Doctor has replied to your question",
  "question",
  question._id
);

// ...existing code...