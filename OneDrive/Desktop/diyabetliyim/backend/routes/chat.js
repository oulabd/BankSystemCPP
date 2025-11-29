const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const uploadChat = require('../middleware/uploadChat');
const {
  getChatHistory,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
  getContacts,
  markAllMessagesAsRead
} = require('../controllers/chatController');

// All routes require authentication
router.use(authMiddleware);

router.get('/contacts', getContacts);
router.get('/history/:userId', getChatHistory);
router.post('/send', uploadChat.single('attachment'), sendMessage);
router.patch('/read/:msgId', markMessageAsRead);
router.patch('/read-all/:userId', markAllMessagesAsRead);
router.get('/unread-count', getUnreadCount);

module.exports = router;
