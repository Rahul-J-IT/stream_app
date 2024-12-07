const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');  // Import the Express app
const  connectDB  = require('./config/db');

// Create an HTTP server using the Express app
const server = http.createServer(app);
const io = socketIo(server); // Initialize Socket.IO

// WebRTC Signaling
io.on('connection', (socket) => {
  console.log('New WebRTC client connected:', socket.id);

  // Handle incoming offer
  socket.on('offer', (data) => {
    console.log('Received offer:', data);
    socket.to(data.socketId).emit('offer', data.offer);
  });

  // Handle incoming answer
  socket.on('answer', (data) => {
    console.log('Received answer:', data);
    socket.to(data.socketId).emit('answer', data.answer);
  });

  // Handle incoming ICE candidates
  socket.on('ice-candidate', (data) => {
    console.log('Received ICE candidate:', data);
    socket.to(data.socketId).emit('ice-candidate', data.candidate);
  });

  socket.on('disconnect', () => {
    console.log('WebRTC client disconnected:', socket.id);
  });
});

// Connect to MongoDB
connectDB();

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});