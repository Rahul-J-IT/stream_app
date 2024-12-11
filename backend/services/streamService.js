// /server/services/streamService.js
const streams = new Map();

const createStream = (title, streamerId) => {
  // Check if there's already an active stream for this event
  const existingStream = Array.from(streams.values())
    .find(s => s.streamerId === streamerId && s.isLive);

  if (existingStream) {
    return existingStream;
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
  return newStream;
};

const getAllStreams = () => {
  return Array.from(streams.values())
    .map(stream => ({
      ...stream,
      isLive: Boolean(stream.isLive),
      viewerCount: stream.viewers || 0
    }));
};

const getStreamById = (streamId) => {
  return streams.get(streamId);
};

const updateStream = (streamId, updates) => {
  const stream = streams.get(streamId);
  if (stream) {
    Object.assign(stream, updates);
    return stream;
  }
  return null;
};

module.exports = {
  createStream,
  getAllStreams,
  getStreamById,
  updateStream,
  streams
};