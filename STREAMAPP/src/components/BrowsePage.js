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
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term
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
      console.log('Fetched events:', response.data); // Debug log
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
    if (!dateString) return "Invalid date";
  
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date"; // Handle invalid date strings
  
    // Format as dd/mm/yyyy, hh:mm AM/PM
    const formattedDate = date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  
    return `${formattedDate}, ${formattedTime}`;
  };
  
  

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await fetchEvents();
        console.log('All fetched events:', fetchedEvents);
        console.log('Private events:', fetchedEvents.filter(event => event.eventType === 'Private'));
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

  useEffect(() => {
    console.log('Current category:', category);
    console.log('Current events:', events);
    console.log('Filtered events:', getFilteredEvents());
  }, [category, events]);

  const getFilteredEvents = () => {
    let filtered = events;

    // First apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Then apply category filter
    if (category === 'public') {
      filtered = filtered.filter(event => event.eventType === 'Public');
      console.log('Public events:', filtered);
    } else if (category === 'private') {
      filtered = filtered.filter(event => event.eventType === 'Private');
      console.log('Private events:', filtered);
    }

    return filtered;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Filter events by category and search term
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
          <button 
            onClick={() => setCategory('all')}
            className={category === 'all' ? 'active' : ''}
          >
            All Events
          </button>
          <button 
            onClick={() => setCategory('public')}
            className={category === 'public' ? 'active' : ''}
          >
            Public
          </button>
          <button 
            onClick={() => setCategory('private')}
            className={category === 'private' ? 'active' : ''}
          >
            Private
          </button>
        </div>
      </div>
      <div className="event-container">
        {getFilteredEvents().length === 0 ? (
          <div>No events match your search criteria.</div>
        ) : (
          getFilteredEvents().map((event) => (
            <div key={event._id} className="event-card">
              <h3>{event.eventName}</h3>
              <p style={{margin:"1em 0"}}>{event.description}</p>
              <p>Location: {event.location || 'Online'}</p>
              <p>Start: {formatDateTime(event.startDate)}</p>
              <p>End: {formatDateTime(event.endDate)}</p>
              <p>Creator: {event.creator?.name || 'Unknown'}</p>
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
