const messagesService = require('./messages.service');
const { successResponse, paginatedResponse } = require('../../utils/apiResponse');

const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const conversations = await messagesService.getConversations(userId);
    return successResponse(res, conversations, 'Conversations fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const { messages, total } = await messagesService.getMessages(
      id,
      userId,
      Number(page),
      Number(limit)
    );

    return paginatedResponse(res, messages, total, page, limit, 'Messages fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const startConversation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { listingId, recipientId } = req.body;
    const conversation = await messagesService.startConversation(userId, listingId, recipientId);
    return successResponse(res, conversation, 'Conversation initialized successfully.', 201);
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await messagesService.markAsRead(id, userId);
    return successResponse(res, null, 'Messages marked as read.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConversations,
  getMessages,
  startConversation,
  markAsRead
};
