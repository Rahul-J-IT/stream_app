const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventName: { type: String, required: true },
    description: { type: String, required: true },
    location: { 
      type: String, 
      enum: ['Physical', 'Virtual'],  // Make location an enum for consistency
      required: true 
    },
    virtualLink: { type: String },  // Optional for virtual events
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    eventType: { 
      type: String, 
      enum: ['Public', 'Private'], 
      required: true 
    },
    ticketsRequired: { type: Boolean, default: false },
    maxCapacity: { type: Number, default: 50 },
    streaming: { type: Boolean, default: false },   // Tracks if event is being streamed
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // Track participants
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;
