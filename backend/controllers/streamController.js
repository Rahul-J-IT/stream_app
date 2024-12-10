const { streams } = require('../models/streamModel');

exports.createStream = (req, res) => {
  try {
    const { title, streamerId } = req.body;

    const existingStream = Array.from(streams.values())
      .find(s => s.streamerId === streamerId && s.isLive);

    if (existingStream) {
      return res.json({ success: true, stream: existingStream });
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
    res.status(201).json({ success: true, stream: newStream });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create stream' });
  }
};

exports.getStreams = (req, res) => {
  try {
    const activeStreams = Array.from(streams.values())
      .map(stream => ({
        ...stream,
        isLive: Boolean(stream.isLive),
        viewerCount: stream.viewers || 0
      }));

    res.json({ success: true, streams: activeStreams });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch streams' });
  }
};
