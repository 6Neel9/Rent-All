const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate); // Require authentication for all notification routes

router.get('/', notificationsController.getMyNotifications);
router.get('/unread', notificationsController.getUnreadCount);
router.put('/:id/read', notificationsController.markAsRead);

module.exports = router;
