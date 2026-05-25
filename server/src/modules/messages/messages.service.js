const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');

const getConversations = async (userId) => {
  const conversations = await Conversation.find({ userIds: userId })
    .populate('userIds', 'fullName avatarUrl')
    .populate({
      path: 'listingId',
      select: 'title pricePerDay images',
    })
    .sort({ updatedAt: -1 });

  const conversationList = await Promise.all(conversations.map(async (c) => {
    const cObj = c.toJSON();
    cObj.participants = cObj.userIds;
    delete cObj.userIds;

    if (cObj.listingId) {
      cObj.listing = cObj.listingId;
      if (cObj.listing.images) {
        cObj.listing.images = cObj.listing.images.filter(img => img.isPrimary).slice(0, 1);
      }
      delete cObj.listingId;
    }

    const lastMessage = await Message.findOne({ conversationId: c._id })
      .sort({ createdAt: -1 })
      .populate('senderId', 'fullName');

    if (lastMessage) {
      const msgObj = lastMessage.toJSON();
      msgObj.sender = msgObj.senderId;
      delete msgObj.senderId;
      cObj.messages = [msgObj];
    } else {
      cObj.messages = [];
    }

    return cObj;
  }));

  return conversationList;
};

const getMessages = async (conversationId, userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  // Verify membership
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    const error = new Error('Conversation not found.');
    error.statusCode = 404;
    throw error;
  }

  const isMember = conversation.userIds.some(id => id.toString() === userId.toString());
  if (!isMember) {
    const error = new Error('You are not authorized to access this conversation.');
    error.statusCode = 403;
    throw error;
  }

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .populate('senderId', 'fullName avatarUrl');

  const formattedMessages = messages.map(m => {
    const mObj = m.toJSON();
    mObj.sender = mObj.senderId;
    delete mObj.senderId;
    return mObj;
  });

  const total = await Message.countDocuments({ conversationId });

  return { messages: formattedMessages, total };
};

const startConversation = async (userId, listingId, recipientId) => {
  if (userId.toString() === recipientId.toString()) {
    const error = new Error('You cannot start a conversation with yourself.');
    error.statusCode = 400;
    throw error;
  }

  const query = {
    userIds: { $all: [userId, recipientId] }
  };
  
  if (listingId) {
    query.listingId = listingId;
  } else {
    query.listingId = null;
  }

  const existing = await Conversation.findOne(query).populate('userIds', 'fullName avatarUrl');

  if (existing) {
    const exObj = existing.toJSON();
    exObj.participants = exObj.userIds;
    delete exObj.userIds;
    return exObj;
  }

  const newConversation = await Conversation.create({
    listingId: listingId || null,
    userIds: [userId, recipientId]
  });

  const populated = await newConversation.populate('userIds', 'fullName avatarUrl');
  const popObj = populated.toJSON();
  popObj.participants = popObj.userIds;
  delete popObj.userIds;

  return popObj;
};

const markAsRead = async (conversationId, userId) => {
  await Message.updateMany({
    conversationId,
    senderId: { $ne: userId },
    isRead: false
  }, {
    $set: { isRead: true }
  });
  return true;
};

const saveMessage = async (senderId, conversationId, content) => {
  const msg = await Message.create({
    conversationId,
    senderId,
    content
  });

  const populatedMsg = await msg.populate('senderId', 'fullName avatarUrl');
  const mObj = populatedMsg.toJSON();
  mObj.sender = mObj.senderId;
  delete mObj.senderId;

  await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

  return mObj;
};

const getConversationParticipants = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId).select('userIds');
  
  if (conversation) {
    return conversation.userIds.map(id => ({ id: id.toString() }));
  }
  return [];
};

module.exports = {
  getConversations,
  getMessages,
  startConversation,
  markAsRead,
  saveMessage,
  getConversationParticipants
};
