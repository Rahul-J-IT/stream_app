import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import './App.css';

function Topbar() {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);

  const getCookie = (name) => {
    const cookieArr = document.cookie.split(';');
    for (let cookie of cookieArr) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) return decodeURIComponent(cookieValue);
    }
    return null;
  };

  // Function to fetch profile data
  const fetchProfileImage = async () => {
    const token = getCookie('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileImage(data.profileImage);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Fetch profile image when component mounts
  useEffect(() => {
    fetchProfileImage();
  }, []);

  // Retrieve username from cookies
  const userName = getCookie('username');

  const handleLogout = () => {
    setProfileImage(null);
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    navigate('/login');
  };

  return (
    <div className="topbar">
      <div style={{ display: "flex", gap: "15px" }}>
        <Link to="/browse" className="logo-link">
          <h1 className="logo">Browse</h1>
        </Link>
        <Link to="/create-event" className="create-event-link">
          <h2 className='event'>Create Event</h2>
        </Link>
      </div>

      <div className="auth-buttons">
        {userName ? (
          <>
            <span style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "13px" }}>
              Welcome, {userName}
              <Link 
                to="/profile" 
                style={{ 
                  color: '#007bff',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#f0f0f0',
                  transition: 'all 0.2s',
                  fontSize: '1.2em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {profileImage ? (
                  <img 
                    src={`${process.env.REACT_APP_API_URL}/uploads/${profileImage}`}
                    alt="Profile"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const icon = document.createElement('i');
                      icon.className = 'fas fa-user';
                      e.target.parentNode.appendChild(icon);
                    }}
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} />
                )}
              </Link>
            </span>
            <button onClick={handleLogout} className="login-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="login-btn">Log In</button>
            </Link>
            <Link to="/signup">
              <button className="signup-btn">Sign Up</button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Topbar;
