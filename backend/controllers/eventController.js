const Event = require('../models/Event');

// Create a new event
const createEvent = async (req, res) => {
  const {
    eventName,
    description,
    location,
    startDate,
    endDate,
    startTime,
    endTime,
    eventType,
    ticketsRequired,
    maxCapacity,
    virtualLink,
  } = req.body;

  try {
    // Ensure required fields are present
    if (!eventName || !startDate || !startTime || !endDate || !endTime || !location || !eventType) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    const newEvent = new Event({
      eventName,
      description,
      location,
      startDate,
      endDate,
      startTime,
      endTime,
      eventType,
      ticketsRequired,
      maxCapacity,
      virtualLink,
      creator: req.user.id,  // Assuming you have user authentication
      streaming: false,       // Default to no streaming at creation
      participants: [],       // Empty participants list at creation
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating event' });
  }
};

// Get all public events
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ eventType: 'Public' }).populate('creator', 'name');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// Get a single event by ID
const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id).populate('creator', 'name');

  if (event) {
    res.json(event);
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
};

// Update an event (only by creator)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Ensure only the creator can update the event
    if (event.creator.toString() !== req.user.id) {
      return res.status(401).json({ message: 'You can only edit your own events' });
    }

    // Update fields if provided, fallback to existing values
    event.eventName = req.body.eventName ?? event.eventName;
    event.description = req.body.description ?? event.description;
    event.location = req.body.location ?? event.location;
    event.startDate = req.body.startDate ?? event.startDate;
    event.endDate = req.body.endDate ?? event.endDate;
    event.startTime = req.body.startTime ?? event.startTime;
    event.endTime = req.body.endTime ?? event.endTime;
    event.eventType = ['Public', 'Private'].includes(req.body.eventType) ? req.body.eventType : event.eventType;
    event.ticketsRequired = req.body.ticketsRequired ?? event.ticketsRequired;
    event.maxCapacity = req.body.maxCapacity ?? event.maxCapacity;
    event.virtualLink = req.body.virtualLink ?? event.virtualLink;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an event (only by creator)
const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if the current user is the creator of the event
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Event.findByIdAndDelete(id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start streaming for an event
const startStreaming = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Set event streaming status to true
    event.streaming = true;
    await event.save();

    res.json({ message: 'Event stream started', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error starting event stream' });
  }
};

// Stop streaming for an event
const stopStreaming = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Set event streaming status to false
    event.streaming = false;
    await event.save();

    res.json({ message: 'Event stream stopped', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error stopping event stream' });
  }
};

// Add participant to event stream
const addParticipant = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add participant if not already added
    if (!event.participants.includes(req.user.id)) {
      event.participants.push(req.user.id);
      await event.save();
    }

    res.json({ message: 'Added to event stream', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding participant to stream' });
  }
};

// Attend an event
const attendEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event && event.participants.length < event.maxCapacity) {
    if (!event.participants.includes(req.user._id)) {
      event.participants.push(req.user._id);
      await event.save();
      res.json({ message: 'You have successfully attended the event' });
    } else {
      res.status(400).json({ message: 'You are already attending this event' });
    }
  } else {
    res.status(400).json({ message: 'Event is full or not found' });
  }
};

module.exports = { 
  createEvent, 
  getEvents, 
  getEventById, 
  updateEvent, 
  deleteEvent, 
  startStreaming, 
  stopStreaming, 
  addParticipant, 
  attendEvent 
};
