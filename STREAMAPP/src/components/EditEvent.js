import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [eventImage, setEventImage] = useState(null);

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

  useEffect(() => {
    if (event?.imageUrl) {
      setImagePreview(`http://localhost:5000/${event.imageUrl}`);
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent((prevEvent) => ({
      ...prevEvent,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEventImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
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
      navigate('/browse');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event.');
    }
  };

  if (error) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  if (!event) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{
      padding: '40px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <button style={{
          padding: '8px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '20px',
          color: 'white'
        }}>
          Personal Calendar ▼
        </button>
        <button style={{
          padding: '8px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '20px',
          color: 'white'
        }}>
          Public ▼
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{
          position: 'relative',
          width: '300px',
          height: '300px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Event preview" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ fontSize: '40px' }}>📷</span>
              <span>Upload Event Image</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer'
            }}
          />
        </div>

        <input
          type="text"
          name="eventName"
          value={event.eventName}
          onChange={handleChange}
          style={{
            padding: '16px',
            fontSize: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            width: '100%'
          }}
        />

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '12px'
        }}>
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Start</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="date"
                  name="startDate"
                  value={event.startDate ? event.startDate.split('T')[0] : ''}
                  onChange={handleChange}
                  style={{
                    flex: 2,
                    padding: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <input
                  type="time"
                  name="startTime"
                  value={event.startTime}
                  onChange={handleChange}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>End</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="date"
                  name="endDate"
                  value={event.endDate ? event.endDate.split('T')[0] : ''}
                  onChange={handleChange}
                  style={{
                    flex: 2,
                    padding: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <input
                  type="time"
                  name="endTime"
                  value={event.endTime}
                  onChange={handleChange}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255, 255, 255, 0.6)' }}>
            GMT+05:30 Calcutta
          </div>
        </div>

        <div>
          <input
            type="text"
            name="location"
            value={event.location}
            onChange={handleChange}
            style={{
              padding: '16px',
              fontSize: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              width: '100%'
            }}
          />
          <span style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '8px',
            display: 'block'
          }}>
            Offline location or virtual link
          </span>
        </div>

        <textarea
          name="description"
          value={event.description}
          onChange={handleChange}
          style={{
            padding: '16px',
            fontSize: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            width: '100%',
            minHeight: '120px',
            resize: 'vertical'
          }}
        />

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '24px',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '24px' }}>Event Options</h3>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <h4>Tickets</h4>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {event.ticketsRequired ? 'Required' : 'Free'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEvent(prev => ({
                ...prev,
                ticketsRequired: !prev.ticketsRequired
              }))}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Edit
            </button>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4>Capacity</h4>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {event.maxCapacity === 100 ? 'Unlimited' : `${event.maxCapacity} people`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEvent(prev => ({
                ...prev,
                maxCapacity: prev.maxCapacity === 100 ? 50 : 100
              }))}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Edit
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '24px'
        }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '16px',
              backgroundColor: '#4444ff',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Update Event
          </button>
          <button
            type="button"
            onClick={() => navigate('/browse')}
            style={{
              flex: 1,
              padding: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEvent;