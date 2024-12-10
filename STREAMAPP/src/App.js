import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Topbar from './components/Topbar';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import Sidebar from './components/Sidebar';
import MainPlayer from './components/MainPlayer';
import LiveGrid from './components/LiveGrid';
import BrowsePage from './components/BrowsePage';
import CreateEventPage from './components/CreateEventPage';
import EditEvent from './components/EditEvent';
import StreamPlayer from './components/StreamPlayer';
import CreateStreamPage from './components/CreateStreamPage';
import ViewStreamPage from './components/ViewStreamPage';
import './components/App.css';

function App() {
    
  return (
    <Router>
      <div className="app">
        <Topbar />
        <div className="content">
          <Sidebar />
          <div className="main-content">
            <Routes>
              {/* Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Home Page */}
              <Route
                path="/"
                element={
                  <>
                    {/* <MainPlayer /> */}
                    {/* <LiveGrid /> */}
                    <BrowsePage />
                  </>
                }
              />

              {/* Browse Events Page */}
              <Route path="/browse" element={<BrowsePage />} />

              {/* Create Event Page */}
              <Route path="/create-event" element={<CreateEventPage />} />

              {/* Edit Event Page */}
              <Route path="/edit-event/:id" element={<EditEvent />} />

              {/* Stream Player Page */}
              <Route path="/watch/:id" element={<StreamPlayer />} />

              {/* Create Stream Page */}
              <Route path="/create-stream/:eventId" element={<CreateStreamPage />} />

              {/* View Stream Page */}
              <Route path="/view-stream/:eventId" element={<ViewStreamPage />} />

              {/* Fallback for unmatched routes */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
