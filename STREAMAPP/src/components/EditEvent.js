import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate
import axios from 'axios';
import './EditEvent.css';

const EditEvent = () => {
  const { id } = useParams(); // Get the event ID from the URL
  const navigate = useNavigate(); // Initialize navigate
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  const getCookie = (name) => {
    const cookieArr = document.cookie.split(';');
    for (let cookie of cookieArr) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) return decodeURIComponent(cookieValue);
    }
    return null;
  };

  const token = getCookie('token');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/events/${id}`);
        setEvent(response.data);
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to load event.');
      }
    };

    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent((prevEvent) => ({
      ...prevEvent,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Token is missing!');
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/events/${id}`, event, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Event updated successfully!');
      navigate('/browse'); // Navigate back to BrowsePage
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event.');
    }
  };

  if (error) return <div>{error}</div>;
  if (!event) return <div>Loading...</div>;

  return (
    <div className="edit-event-form">
      <h1>Edit Event</h1>
      <form onSubmit={handleSubmit}>

        <label>
          Event Name:
        </label>
        <input
            type="text"
            name="eventName"
            value={event.eventName || ''}
            onChange={handleChange}
          />
        
        
        <label>
          Description:
        </label>
        <textarea
            name="description"
            value={event.description || ''}
            onChange={handleChange}
          />
        
          <label>
          Location:
        </label>
        <input
            type="text"
            name="location"
            value={event.location || ''}
            onChange={handleChange}
          />

        <label>
          Start Date:
        </label>
        <input
            type="date"
            name="startDate"
            value={event.startDate ? event.startDate.split('T')[0] : ''}
            onChange={handleChange}
          />

        <label>
          End Date:
        </label>
        <input
            type="date"
            name="endDate"
            value={event.endDate ? event.endDate.split('T')[0] : ''}
            onChange={handleChange}
          />

        <label>
          Start Time:
        </label>
        <input
            type="time"
            name="startTime"
            value={event.startTime || ''}
            onChange={handleChange}
          />

        <label>
          End Time:
        </label>
        <input
            type="time"
            name="endTime"
            value={event.endTime || ''}
            onChange={handleChange}
          />

        <label>
          Event Type:
        </label>
        <select name="eventType" value={event.eventType || ''} onChange={handleChange}>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>

          
<div className="toggle-switch">
<label>
  Tickets Required:
</label>
  <input
    type="checkbox"
    id="ticketsRequired"
    name="ticketsRequired"
    checked={event.ticketsRequired || false}
    onChange={(e) =>
      setEvent((prevEvent) => ({
        ...prevEvent,
        ticketsRequired: e.target.checked,
      }))
    }
  />
  <label htmlFor="ticketsRequired" className="switch-label"></label>
  <span>{event.ticketsRequired ? 'Yes' : 'No'}</span>
</div>


        <label>
          Max Capacity:
        </label>
        <input
            type="number"
            name="maxCapacity"
            value={event.maxCapacity || ''}
            onChange={handleChange}
          />
          
        <button type="submit">Save Changes</button>
        <button type="button" onClick={() => navigate('/browse')}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditEvent;