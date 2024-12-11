// /server/services/socketService.js
const { Server } = require('socket.io');
const streamService = require('./streamService');

const initializeSocketService = (server, corsOptions) => {
  const io = new Server(server, { cors: corsOptions });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Broadcaster registration
    socket.on('register-broadcaster', ({ streamId }) => {
      const stream = streamService.getStreamById(streamId);
      
      if (stream) {
        socket.streamId = streamId;
        socket.role = 'broadcaster';
        socket.join(streamId);
        
        stream.socketId = socket.id;
        stream.isLive = true;
      }
    });

    // Viewer joining
    socket.on('join-stream', ({ streamId }) => {
      socket.streamId = streamId;
      socket.role = 'viewer';
      socket.join(streamId);

      const stream = streamService.getStreamById(streamId);
      if (stream) {
        stream.viewers = (stream.viewers || 0) + 1;
        io.to(streamId).emit('viewer-joined', {
          viewerId: socket.id,
          viewers: stream.viewers
        });
      }
    });

    // Chat message handling
    socket.on('send-message', (messageData) => {
      const { eventId, text, username, timestamp, isBroadcaster } = messageData;
      const streamId = socket.streamId;
      
      if (streamId) {
        io.to(streamId).emit('chat-message', {
          text,
          username,
          timestamp,
          isBroadcaster,
          eventId,
          streamId
        });
      }
    });

    // WebRTC signaling
    socket.on('offer', ({ offer, viewerId, streamId }) => {
      io.to(viewerId).emit('offer', {
        offer,
        broadcasterId: socket.id
      });
    });

    socket.on('answer', ({ answer, broadcasterId }) => {
      io.to(broadcasterId).emit('answer', {
        answer,
        viewerId: socket.id
      });
    });

    socket.on('ice-candidate', ({ candidate, targetId }) => {
      io.to(targetId).emit('ice-candidate', {
        candidate,
        senderId: socket.id
      });
    });

    // Stream ending
    socket.on('end-stream', () => {
      if (socket.streamId) {
        const stream = streamService.getStreamById(socket.streamId);
        if (stream) {
          stream.isLive = false;
          io.to(socket.streamId).emit('stream-ended');
        }
      }
    });

    // Disconnection handling
    socket.on('disconnect', () => {
      if (socket.streamId) {
        const stream = streamService.getStreamById(socket.streamId);
        if (stream) {
          if (socket.role === 'broadcaster') {
            stream.isLive = false;
            io.to(socket.streamId).emit('stream-ended');
          } else if (socket.role === 'viewer') {
            stream.viewers = Math.max(0, (stream.viewers || 1) - 1);
            io.to(socket.streamId).emit('viewer-left', {
              viewerId: socket.id,
              viewers: stream.viewers
            });
          }
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocketService;