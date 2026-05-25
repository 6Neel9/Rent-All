const notificationsService = require('./notifications.service');
const { successResponse } = require('../../utils/apiResponse');

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const notifications = await notificationsService.getMyNotifications(userId);
    return successResponse(res, notifications, 'Notifications fetched successfully.');
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await notificationsService.markAsRead(id, userId);
    return successResponse(res, null, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const countData = await notificationsService.getUnreadCount(userId);
    return successResponse(res, countData, 'Unread count fetched successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  getUnreadCount
};
