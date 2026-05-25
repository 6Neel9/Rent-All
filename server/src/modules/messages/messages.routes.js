const express = require('express');
const router = express.Router();
const messagesController = require('./messages.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate); // Require authentication for all chat routes

router.get('/conversations', messagesController.getConversations);
router.get('/conversations/:id', messagesController.getMessages);
router.post('/conversations', messagesController.startConversation);
router.put('/conversations/:id/read', messagesController.markAsRead);

module.exports = router;
