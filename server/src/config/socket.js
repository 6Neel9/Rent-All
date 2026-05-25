const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'rentall_access_secret_token_123!@#';

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }
  });

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    // Get token from auth or headers
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: Access token required'));
    }

    try {
      const decoded = jwt.verify(token, ACCESS_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`User socket connected: user:${userId}`);
    socket.join(`user:${userId}`);

    // Message Send Event handler
    socket.on('message:send', async (data) => {
      // Expecting data: { conversationId, content }
      try {
        const messagesService = require('../modules/messages/messages.service');
        const savedMsg = await messagesService.saveMessage(userId, data.conversationId, data.content);
        const participants = await messagesService.getConversationParticipants(data.conversationId);

        participants.forEach((p) => {
          io.to(`user:${p.id}`).emit('message:new', savedMsg);
          io.to(`user:${p.id}`).emit('conversation:updated', {
            conversationId: data.conversationId,
            lastMessage: savedMsg
          });
        });
      } catch (err) {
        console.error('Socket message:send error:', err.message);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // Typing Event handler
    socket.on('message:typing', async (data) => {
      // Expecting data: { conversationId }
      try {
        const messagesService = require('../modules/messages/messages.service');
        const participants = await messagesService.getConversationParticipants(data.conversationId);
        
        participants.forEach((p) => {
          if (p.id !== userId) {
            io.to(`user:${p.id}`).emit('message:typing', {
              conversationId: data.conversationId,
              userId
            });
          }
        });
      } catch (err) {
        // Fail silently
      }
    });

    // Read Ack Event handler
    socket.on('message:read', async (data) => {
      // Expecting data: { conversationId }
      try {
        const messagesService = require('../modules/messages/messages.service');
        await messagesService.markAsRead(data.conversationId, userId);
        const participants = await messagesService.getConversationParticipants(data.conversationId);
        
        participants.forEach((p) => {
          if (p.id !== userId) {
            io.to(`user:${p.id}`).emit('message:read_ack', {
              conversationId: data.conversationId,
              readerId: userId
            });
          }
        });
      } catch (err) {
        // Fail silently
      }
    });

    socket.on('disconnect', () => {
      console.log(`User socket disconnected: user:${userId}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io server has not been initialized');
  }
  return io;
};

const sendNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
};

module.exports = {
  initSocket,
  getIo,
  sendNotification
};
