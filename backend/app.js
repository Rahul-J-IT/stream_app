// /server/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Route imports
const streamRoutes = require('./routes/streamRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');

// Middleware
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');

// Configure environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS options
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/streams', streamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app,
  corsOptions
};