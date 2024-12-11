import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faCalendar, faVideo, faUsers, faCamera } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const styles = {
  profileAvatar: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    position: 'relative',
    cursor: 'pointer',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
    display: 'block'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    opacity: 0,
    transition: 'opacity 0.3s',
    ':hover': {
      opacity: 1
    }
  }
};

function Profile() {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const getCookie = (name) => {
    const cookieArr = document.cookie.split(';');
    for (let cookie of cookieArr) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) return decodeURIComponent(cookieValue);
    }
    return null;
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

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
        formData.append('profileImage', file);

        const token = getCookie('token');
        const uploadResponse = await axios.post('http://localhost:5000/api/users/upload-profile-image', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('Upload response:', uploadResponse.data);

        const updatedProfile = await axios.get('http://localhost:5000/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Updated profile:', updatedProfile.data);
        console.log('Profile Image URL:', updatedProfile.data.profileImage);

        if (updatedProfile.data.profileImage) {
          const imageUrl = updatedProfile.data.profileImage.startsWith('http') 
            ? updatedProfile.data.profileImage 
            : `http://localhost:5000/uploads/${updatedProfile.data.profileImage}`;
          console.log('Final Image URL:', imageUrl);
          setProfileImage(imageUrl);
        }
        setUserDetails(updatedProfile.data);
        setImagePreview(null);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = getCookie('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Profile response:', response.data);
        console.log('Profile Image from response:', response.data.profileImage);
        
        if (response.data.profileImage) {
          const imageUrl = response.data.profileImage.startsWith('http') 
            ? response.data.profileImage 
            : `http://localhost:5000/uploads/${response.data.profileImage}`;
          console.log('Setting image URL to:', imageUrl);
          setProfileImage(imageUrl);
        }
        setUserDetails(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [navigate]);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div 
          className="profile-avatar"
          onClick={handleImageClick}
          style={styles.profileAvatar}
        >
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Profile Preview" 
              style={styles.avatarImage}
            />
          ) : profileImage ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              style={styles.avatarImage}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0'
            }}>
              <FontAwesomeIcon icon={faUser} size="3x" />
            </div>
          )}
          <div style={styles.overlay} className="profile-avatar-overlay">
            <FontAwesomeIcon icon={faCamera} style={{ marginBottom: '8px' }} />
            <span>Update Photo</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
        {uploading && (
          <div className="upload-status">Uploading...</div>
        )}
        <h1>{userDetails?.name}</h1>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="profile-info-grid">
            <div className="profile-info-item">
              <FontAwesomeIcon icon={faUser} className="profile-icon" />
              <div className="info-content">
                <label>Username</label>
                <span>{userDetails?.name}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <FontAwesomeIcon icon={faEnvelope} className="profile-icon" />
              <div className="info-content">
                <label>Email</label>
                <span>{userDetails?.email}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <FontAwesomeIcon icon={faCalendar} className="profile-icon" />
              <div className="info-content">
                <label>Member Since</label>
                <span>{new Date(userDetails?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Activity Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <FontAwesomeIcon icon={faVideo} className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">{userDetails?.eventsCreated?.length || 0}</span>
                <label>Events Created</label>
              </div>
            </div>

            <div className="stat-card">
              <FontAwesomeIcon icon={faUsers} className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">{userDetails?.eventsAttended?.length || 0}</span>
                <label>Events Attended</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile; 