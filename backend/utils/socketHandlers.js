const { streams } = require('../models/streamModel');

exports.setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('register-broadcaster', ({ streamId }) => {
      const stream = streams.get(streamId);
      if (stream) {
        socket.streamId = streamId;
        socket.role = 'broadcaster';
        socket.join(streamId);
        stream.socketId = socket.id;
        stream.isLive = true;
      }
    });

    socket.on('join-stream', ({ streamId }) => {
      const stream = streams.get(streamId);
      if (stream) {
        socket.streamId = streamId;
        socket.role = 'viewer';
        socket.join(streamId);
        stream.viewers++;
        io.to(streamId).emit('viewer-joined', { viewerId: socket.id, viewers: stream.viewers });
      }
    });

    socket.on('send-message', (messageData) => {
      const { text, username, timestamp, isBroadcaster } = messageData;
      const streamId = socket.streamId;
      if (streamId) {
        io.to(streamId).emit('chat-message', { text, username, timestamp, isBroadcaster });
      }
    });

    socket.on('disconnect', () => {
      if (socket.streamId) {
        const stream = streams.get(socket.streamId);
        if (stream) {
          if (socket.role === 'broadcaster') {
            stream.isLive = false;
            io.to(socket.streamId).emit('stream-ended');
          } else if (socket.role === 'viewer') {
            stream.viewers--;
            io.to(socket.streamId).emit('viewer-left', { viewerId: socket.id, viewers: stream.viewers });
          }
        }
      }
    });
  });
};
