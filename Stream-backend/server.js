const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// Configure CORS
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
}));

// Add body parser middleware
app.use(express.json());

const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store active streams
const streams = new Map();

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// API Endpoints
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
      stream.viewers++;
      io.to(streamId).emit('viewer-joined', {
        viewerId: socket.id,
        viewers: stream.viewers
      });
    }
  });

  // Handle chat messages
  socket.on('send-message', (messageData) => {
    const { eventId, text, username, timestamp, isBroadcaster } = messageData;
    console.log('New chat message:', messageData);
    
    // Get the stream ID from the socket
    const streamId = socket.streamId;
    
    if (streamId) {
      // Broadcast to everyone in the stream room
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

  // Handle WebRTC signaling
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
          stream.viewers--;
          io.to(socket.streamId).emit('viewer-left', {
            viewerId: socket.id,
            viewers: stream.viewers
          });
        }
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Streaming server running on port ${PORT}`);
}); 