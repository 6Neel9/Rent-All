const Notification = require('../../models/Notification');
const { sendNotification } = require('../../config/socket');

const createNotification = async (userId, type, title, body, link = null) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      link
    });

    sendNotification(userId, notification.toJSON());

    return notification.toJSON();
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

const getMyNotifications = async (userId) => {
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
  return notifications.map(n => n.toJSON());
};

const markAsRead = async (id, userId) => {
  await Notification.updateMany({ _id: id, userId }, { isRead: true });
  return true;
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ userId, isRead: false });
  return { count };
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  getUnreadCount
};
