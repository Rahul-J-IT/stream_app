const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');

dotenv.config();

const app = express();

// CORS options to allow credentials from specific origin
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only this origin
  credentials: true,               // Allow credentials (cookies)
};

app.use(cors(corsOptions)); // Apply CORS with the specified options
app.use(express.json());
app.use(express.static('public')); // For static assets if needed

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

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

module.exports = app;
