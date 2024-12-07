const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  startStreaming,
  stopStreaming,
  addParticipant,
  attendEvent,
 
} = require('../controllers/eventController');  // Ensure all functions are imported

const { protect } = require('../middlewares/auth'); // Import protect middleware

const router = express.Router();

// Route to create a new event and get all events (protected for create event)
router.route('/')
  .post(protect, createEvent)  // Protect create event
  .get(getEvents);  // Publicly accessible route to get all events

// Routes for event with a specific ID
router.route('/:id')
  .get(getEventById)  // Publicly accessible route to get a single event
  .put(protect, updateEvent)  // Protected route to update event
  .delete(protect, deleteEvent);  // Protected route to delete event

// Routes for event attendance and participation
router.route('/:id/attend')
  .post(protect, attendEvent);  // Protected route to attend event

// Routes for streaming control (protected)
router.route('/:eventId/start-streaming')
  .post(protect, startStreaming);  // Protected route to start streaming

router.route('/:eventId/stop-streaming')
  .post(protect, stopStreaming);  // Protected route to stop streaming

// Route for adding participant to event stream
router.route('/:eventId/attend')
  .post(protect, addParticipant);  // Protected route to add participant

module.exports = router;
