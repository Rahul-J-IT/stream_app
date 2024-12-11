// /server/controllers/streamController.js
const streamService = require('../services/streamService');

const createStream = (req, res) => {
  try {
    const { title, streamerId } = req.body;
    const stream = streamService.createStream(title, streamerId);
    
    res.status(201).json({ 
      success: true,
      stream 
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create stream' 
    });
  }
};

const getStreams = (req, res) => {
  try {
    const streams = streamService.getAllStreams();
    
    res.json({ 
      success: true,
      streams 
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch streams' 
    });
  }
};

module.exports = {
  createStream,
  getStreams
};