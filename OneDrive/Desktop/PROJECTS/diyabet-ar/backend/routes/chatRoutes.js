const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyJWT, checkRole } = require('../middleware/auth');

router.use(verifyJWT); // جميع المسارات تتطلب المصادقة

router.get('/contacts', chatController.getContacts);
router.get('/:patientId', chatController.getConversation);
router.post('/send', chatController.sendMessage);
router.put('/read/:messageId', chatController.markAsRead);
router.delete('/:id', checkRole('doctor'), chatController.deleteMessage); // الأطباء فقط يمكنهم الحذف

module.exports = router;