import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import './CreateEventPage.css';

const CreateEventPage = () => {
  // Form state variables
  const [eventType, setEventType] = useState('Public'); // Event type: Public or Private
  const [locationType, setLocationType] = useState('Physical'); // Location: Physical or Virtual
  const [capacity, setCapacity] = useState(50); // Default max capacity set to 50
  const [requireApproval, setRequireApproval] = useState(false); // Toggle for tickets required
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [eventImage, setEventImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  // Handlers for form input
  const handleLocationChange = (event) => setLocationType(event.target.value);

  const handleCapacityChange = (event) => {
    const value = Math.max(1, Math.min(100, event.target.value)); // Max capacity set to 100
    setCapacity(value);
  };

  const handleToggleChange = () => setRequireApproval(!requireApproval);

  // Update handleImageChange to use FormData and upload immediately
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('eventImage', file);

        const token = getCookie('token');
        const uploadResponse = await axios.post('http://localhost:5000/api/events/upload-image', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('Upload response:', uploadResponse.data);
        setEventImage(uploadResponse.data.imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  // Add validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }
    
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    if (!endTime) {
      newErrors.endTime = 'End time is required';
    }
    
    if (!locationType) {
      newErrors.location = 'Location is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update handleSubmit to include the image URL
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const token = getCookie('token');
    console.log('Token:', token);

    if (!token) {
      console.error('No token found. User might not be authenticated.');
      return;
    }

    const eventData = {
      eventName,
      startDate: new Date(startDate).toISOString().split('T')[0],
      startTime,
      endDate,
      endTime,
      location: locationType,
      description,
      eventType,
      ticketsRequired: requireApproval,
      maxCapacity: capacity,
      eventImage: eventImage // Add the image URL to event data
    };

    try {
      const response = await axios.post('http://localhost:5000/api/events', eventData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Event created successfully:', response.data);
      window.location.href = '/browse';
    } catch (error) {
      console.error('Error creating event:', error.response ? error.response.data : error.message);
    }
  };

  // Helper function to get input style with error state
  const getInputStyle = (fieldName) => ({
    padding: '16px',
    fontSize: fieldName === 'eventName' ? '24px' : '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: errors[fieldName] ? '2px solid #ff4444' : 'none',
    borderRadius: '8px',
    color: 'white',
    width: '100%'
  });

  return (
    <div style={{
      padding: '40px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Header Section */}
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
        {/* Image Upload Section */}
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
        {uploading && (
          <div style={{ 
            color: '#ff4444', 
            marginTop: '10px',
            fontSize: '0.9em',
            animation: 'pulse 1.5s infinite'
          }}>
            Uploading...
          </div>
        )}

        {/* Event Name Input */}
        <div>
          <input
            type="text"
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            style={getInputStyle('eventName')}
          />
          {errors.eventName && (
            <div style={{ 
              color: '#ff4444', 
              fontSize: '14px', 
              marginTop: '4px' 
            }}>
              {errors.eventName}
            </div>
          )}
        </div>

        {/* Date and Time Section */}
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
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={getInputStyle('startDate')}
                />
                {errors.startDate && (
                  <div style={{ color: '#ff4444', fontSize: '14px' }}>
                    {errors.startDate}
                  </div>
                )}
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={getInputStyle('startTime')}
                />
                {errors.startTime && (
                  <div style={{ color: '#ff4444', fontSize: '14px' }}>
                    {errors.startTime}
                  </div>
                )}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>End</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={getInputStyle('endDate')}
                />
                {errors.endDate && (
                  <div style={{ color: '#ff4444', fontSize: '14px' }}>
                    {errors.endDate}
                  </div>
                )}
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={getInputStyle('endTime')}
                />
                {errors.endTime && (
                  <div style={{ color: '#ff4444', fontSize: '14px' }}>
                    {errors.endTime}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255, 255, 255, 0.6)' }}>
            GMT+05:30 Calcutta
          </div>
        </div>

        {/* Location Input */}
        <div>
          <input
            type="text"
            placeholder="Add Event Location"
            value={locationType}
            onChange={handleLocationChange}
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

        {/* Description Input */}
        <div>
          <textarea
            placeholder="Add Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={getInputStyle('description')}
          />
          {errors.description && (
            <div style={{ 
              color: '#ff4444', 
              fontSize: '14px', 
              marginTop: '4px' 
            }}>
              {errors.description}
            </div>
          )}
          <span style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '8px',
            display: 'block'
          }}>
            Describe your event
          </span>
        </div>

        {/* Event Options */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '24px',
          borderRadius: '12px'
        }}>
          <h3 style={{ marginBottom: '24px' }}>Event Options</h3>
          
          {/* Add Event Type Option */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <h4>Event Type</h4>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {eventType}
              </span>
            </div>
            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setEventType('Public')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: eventType === 'Public' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setEventType('Private')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: eventType === 'Private' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Private
              </button>
            </div>
          </div>

          {/* Tickets Option */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <h4>Tickets</h4>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {requireApproval ? 'Required' : 'Free'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleChange}
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

          {/* Capacity Option */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4>Capacity</h4>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {capacity === 100 ? 'Unlimited' : `${capacity} people`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCapacity(prev => prev === 100 ? 50 : 100)}
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

        {/* Create Event Button */}
        <button
          type="submit"
          style={{
            padding: '16px',
            backgroundColor: '#4444ff',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '24px'
          }}
        >
          Create Event
        </button>
      </form>
    </div>
  );
};

export default CreateEventPage;
