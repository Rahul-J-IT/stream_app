// /server/server.js
const http = require('http');
const connectDB = require('./config/db');
const { app, corsOptions } = require('./app');
const initializeSocketService = require('./services/socketService');
const express = require('express');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket Service
    initializeSocketService(server, corsOptions);

    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

app.use('/uploads', express.static('uploads'));