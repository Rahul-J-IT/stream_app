import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BrowsePage.css';

// Import Font Awesome icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons';

const BrowsePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');
  const [thumbnails, setThumbnails] = useState({}); // State for event-specific thumbnails

  const navigate = useNavigate();

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
    const usernameFromCookie = getCookie('username');
    setUserName(usernameFromCookie || '');
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Event deleted!');
      setEvents((prevEvents) => prevEvents.filter((event) => event._id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete event!');
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-event/${id}`);
  };

  const formatDateTime = (dateString) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    const date = new Date(dateString);
    return date.toLocaleString('en-GB', options);
  };

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await fetchEvents();
        setEvents(fetchedEvents);

        // Assuming events contain a field `thumbnail` or `eventThumbnail` for image URL
        const thumbnailData = fetchedEvents.reduce((acc, event) => {
          acc[event._id] = event.thumbnail || 'https://via.placeholder.com/150';
          return acc;
        }, {});
        setThumbnails(thumbnailData);

      } catch (error) {
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const filteredEvents = events
    .filter((event) =>
      category ? event.eventType?.toLowerCase() === category.toLowerCase() : true
    )
    .filter((event) =>
      searchTerm
        ? event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

  return (
    <div>
      <h2>Event Listings</h2>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="filters">
        <div className="category-buttons">
          <button onClick={() => setCategory('')}>All Events</button>
          <button onClick={() => setCategory('public')}>Public</button>
          <button onClick={() => setCategory('private')}>Private</button>
        </div>
      </div>
      <div className="event-container">
        {filteredEvents.length === 0 ? (
          <div>No events match your search criteria.</div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event._id} className="event-card">
              <div className="thumbnail">
                <img
                  src={thumbnails[event._id] || 'https://via.placeholder.com/150'}
                  alt={`${event.eventName} thumbnail`}
                />
              </div>
              <h3 style={{marginBottom:"1em"}}>{event.eventName}</h3>
              <p style={{marginBottom:"2em"}}>{event.description}</p>
              <p><span>Location: </span>{event.location || 'Online'}</p>
              <p><span>Start:</span> {formatDateTime(event.startDate)}</p>
              <p><span>End:</span> {formatDateTime(event.endDate)}</p>
              <p style={{marginBottom:"2em"}}><span>Creator:</span> {event.creator?.name || 'Unknown'}</p>
              {event.creator?.name === userName ? (
                <div className="button-group">
                  <button onClick={() => handleDelete(event._id)} className="icon-btn">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button onClick={() => handleEdit(event._id)} className="icon-btn">
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
                  <button
                    onClick={() => navigate(`/create-stream/${event._id}`)}
                    className="icon-btn"
                  >
                    Start Stream
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/view-stream/${event._id}`)}
                  className="view-stream-btn"
                >
                  View Stream
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrowsePage;
