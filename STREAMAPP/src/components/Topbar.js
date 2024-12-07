import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';

function Topbar() {
  const navigate = useNavigate();

  const getCookie = (name) => {
    const cookieArr = document.cookie.split(';');
    for (let cookie of cookieArr) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) return decodeURIComponent(cookieValue);
    }
    return null;
  };

  // Retrieve username from cookies
  const userName = getCookie('username');

  const handleLogout = () => {
    // Clear cookies by setting expiration date in the past
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Redirect to the login page
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
{/* 
      <input className="search-bar" type="text" placeholder="Search" /> */}

      <div className="auth-buttons">
        {userName ? (
          <>
            <span style={{ display: "flex", gap: "15px", marginTop:"13px" }}>Welcome, {userName}</span>
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
