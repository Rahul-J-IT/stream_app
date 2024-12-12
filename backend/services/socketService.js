// /server/services/socketService.js
const { Server } = require('socket.io');
const Event = require('../models/Event');

const initializeSocketService = (server, corsOptions) => {
  const io = new Server(server, { cors: corsOptions });
  const streams = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Broadcaster registration
    socket.on('register-broadcaster', async ({ streamId }) => {
      console.log('Registering broadcaster for stream:', streamId);
      
      let stream = streams.get(streamId);
      if (!stream) {
        stream = {
          id: streamId,
          isLive: true,
          viewers: 0,
          streamerId: socket.streamerId
        };
        streams.set(streamId, stream);
      }
      
      socket.streamId = streamId;
      socket.role = 'broadcaster';
      socket.join(streamId);
      
      stream.socketId = socket.id;
      stream.isLive = true;

      // Update event streaming status in database
      try {
        await Event.findByIdAndUpdate(stream.streamerId, { streaming: true });
        console.log('Event streaming status updated to true');
      } catch (error) {
        console.error('Error updating event streaming status:', error);
      }
    });

    // Viewer joining
    socket.on('join-stream', ({ streamId }) => {
      console.log('Viewer joining stream:', streamId);
      socket.streamId = streamId;
      socket.role = 'viewer';
      socket.join(streamId);

      const stream = streams.get(streamId);
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
      const streamId = socket.streamId;
      if (streamId) {
        io.to(streamId).emit('chat-message', {
          ...messageData,
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
    socket.on('end-stream', async () => {
      if (socket.streamId) {
        const stream = streams.get(socket.streamId);
        if (stream) {
          try {
            // Update database first
            await Event.findByIdAndUpdate(stream.streamerId, 
              { streaming: false },
              { new: true }
            );

            // Then update local state and notify clients
            stream.isLive = false;
            streams.delete(socket.streamId);
            
            // Notify all clients in the room
            io.to(socket.streamId).emit('stream-ended');
            
            console.log('Stream ended and removed:', stream);
          } catch (error) {
            console.error('Error ending stream:', error);
          }
        }
      }
    });

    // Disconnection handling
    socket.on('disconnect', async () => {
      if (socket.streamId) {
        const stream = streams.get(socket.streamId);
        if (stream) {
          if (socket.role === 'broadcaster') {
            try {
              // Update database first
              await Event.findByIdAndUpdate(stream.streamerId, 
                { streaming: false },
                { new: true }
              );

              // Then update local state and notify clients
              stream.isLive = false;
              streams.delete(socket.streamId);
              
              // Notify all clients in the room
              io.to(socket.streamId).emit('stream-ended');
              
              console.log('Stream ended due to broadcaster disconnect');
            } catch (error) {
              console.error('Error handling disconnect:', error);
              // Update event streaming status in database on disconnect
              try {
                await Event.findByIdAndUpdate(stream.streamerId, { streaming: false });
                console.log('Event streaming status updated to false on disconnect');
              } catch (error) {
                console.error('Error updating event streaming status:', error);
              }
              
              io.to(socket.streamId).emit('stream-ended');
              streams.delete(socket.streamId); // Remove the stream from the Map
              console.log('Stream ended and removed due to broadcaster disconnect');
            }
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