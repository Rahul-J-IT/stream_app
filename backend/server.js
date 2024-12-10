const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const connectDB=require('./config/db')
dotenv.config();

const app = express();
const server = http.createServer(app);
connectDB()

// CORS options to allow credentials from specific origin
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only this origin
  credentials: true,               // Allow credentials (cookies)
  methods: ["GET", "POST"],
};

app.use(cors(corsOptions)); // Apply CORS with the specified options
app.use(express.json());
app.use(express.static('public')); // For static assets if needed

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Store active streams
const streams = new Map();

// Configure Socket.IO
const io = new Server(server, {
  cors: corsOptions
});

// Stream Routes
app.post('/api/streams', (req, res) => {
  try {
    const { title, streamerId } = req.body;
    console.log('Creating stream:', { title, streamerId });

    // Check if there's already an active stream for this event
    const existingStream = Array.from(streams.values())
      .find(s => s.streamerId === streamerId && s.isLive);

    if (existingStream) {
      console.log('Returning existing stream:', existingStream);
      return res.json({ 
        success: true,
        stream: existingStream 
      });
    }

    const streamId = Math.random().toString(36).substr(2, 9);
    const newStream = {
      id: streamId,
      title,
      streamerId,
      isLive: true,
      viewers: 0,
      createdAt: new Date().toISOString()
    };
    
    streams.set(streamId, newStream);
    console.log('New stream created:', newStream);
    
    res.status(201).json({ 
      success: true,
      stream: newStream 
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create stream' 
    });
  }
});

app.get('/api/streams', (req, res) => {
  try {
    const activeStreams = Array.from(streams.values())
      .map(stream => ({
        ...stream,
        isLive: Boolean(stream.isLive),
        viewerCount: stream.viewers || 0
      }));

    console.log('Available streams:', activeStreams);
    
    res.json({ 
      success: true,
      streams: activeStreams 
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch streams' 
    });
  }
});


// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register-broadcaster', ({ streamId }) => {
    console.log('Broadcaster registered:', streamId);
    const stream = streams.get(streamId);
    
    if (stream) {
      socket.streamId = streamId;
      socket.role = 'broadcaster';
      socket.join(streamId);
      
      stream.socketId = socket.id;
      stream.isLive = true;
      
      console.log('Stream activated:', stream);
    } else {
      console.log('Stream not found:', streamId);
    }
  });

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
    const { eventId, text, username, timestamp, isBroadcaster } = messageData;
    console.log('New chat message:', messageData);
    
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
      console.log('Message broadcasted to room:', streamId);
    } else {
      console.log('No stream ID found for socket:', socket.id);
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

  // Stream management
  socket.on('end-stream', () => {
    console.log('Stream ending:', socket.streamId);
    if (socket.streamId) {
      const stream = streams.get(socket.streamId);
      if (stream) {
        stream.isLive = false;
        io.to(socket.streamId).emit('stream-ended');
        console.log('Stream ended:', stream);
      }
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.streamId) {
      const stream = streams.get(socket.streamId);
      if (stream) {
        if (socket.role === 'broadcaster') {
          stream.isLive = false;
          io.to(socket.streamId).emit('stream-ended');
          console.log('Stream ended due to broadcaster disconnect:', stream);
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

// Handle 404 errors
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});



// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };