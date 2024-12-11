// /server/routes/streamRoutes.js
const express = require('express');
const { createStream, getStreams } = require('../controllers/streamController');

const router = express.Router();

// Stream creation route
router.post('/', createStream);

// Get all active streams route
router.get('/', getStreams);

module.exports = router;