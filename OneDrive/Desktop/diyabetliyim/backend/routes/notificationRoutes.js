const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.use(auth);

router.get('/', notificationController.getNotifications);
router.patch('/read/:id', notificationController.markNotificationRead);
router.patch('/read-all', notificationController.markAllNotificationsRead);
router.delete('/:id', notificationController.removeNotification);

module.exports = router;