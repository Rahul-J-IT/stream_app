// When starting the stream
socket.emit('register-broadcaster', { 
  streamId: streamId,
  eventId: eventId  // Make sure to pass the eventId
}); 