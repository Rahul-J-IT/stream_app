import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

function Sidebar() {
  const [liveEvents, setLiveEvents] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events');
        console.log('API Response:', response.data); // Log the raw API response
        
        if (!Array.isArray(response.data)) {
          console.error('Expected array of events, got:', typeof response.data);
          return;
        }

        // Filter only streaming events with more lenient check
        const streamingEvents = response.data.filter(event => {
          console.log('Event:', {
            id: event._id,
            name: event.eventName,
            streaming: event.streaming,
            type: typeof event.streaming,
            stringified: JSON.stringify(event)  // Log the entire event object
          });
          
          // More lenient check for streaming status
          return event.streaming === true || 
                 event.streaming === 'true' || 
                 event.streaming === 1;
        });
        
        console.log('Filtered streaming events:', streamingEvents);
        setLiveEvents(streamingEvents);
        setError(null);
      } catch (error) {
        console.error('Error fetching live events:', error.response || error);
        setError('Failed to fetch live events: ' + (error.response?.data?.message || error.message));
      }
    };

    fetchLiveEvents();
    const interval = setInterval(fetchLiveEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinStream = (eventId) => {
    navigate(`/view-stream/${eventId}`);
  };

  return (
    <div className="sidebar">
      <h2>Live Streams</h2>
      {error ? (
        <p style={{ color: '#ff4444', textAlign: 'center', padding: '20px' }}>
          {error}
        </p>
      ) : liveEvents.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
          No live streams available
        </p>
      ) : (
        <ul className="channel-list">
          {liveEvents.map((event) => (
            <li 
              key={event._id}
              onClick={() => handleJoinStream(event._id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="channel-info">
                <span>{event.eventName}</span>
                <div>
                  <span style={{ 
                    color: '#ff4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>LIVE</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Sidebar;
