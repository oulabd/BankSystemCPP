const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyJWT, checkRole } = require('../middleware/auth');

router.use(verifyJWT); // All routes require auth

router.get('/:patientId', chatController.getConversation);
router.post('/send', chatController.sendMessage);
router.put('/read/:messageId', chatController.markAsRead);
router.delete('/:id', checkRole('doctor'), chatController.deleteMessage); // Only doctors can delete

module.exports = router;