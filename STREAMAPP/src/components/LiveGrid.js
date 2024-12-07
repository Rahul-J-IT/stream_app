import React from 'react';
import './App.css';

const liveChannels = [
  { title: 'VALORANT', viewers: '23.9K' },
  { title: 'Fortnite', viewers: '11.8K' },
  { title: 'Apex Legends', viewers: '3.4K' },
  // Add more live channels here...
];

function LiveGrid() {
  return (
    <div className="live-grid">
      <h3>Live channels we think you'll like</h3>
      <div className="grid">
        {liveChannels.map((channel, index) => (
          <div key={index} className="live-card">
            <img
              src="https://via.placeholder.com/150"
              alt={channel.title}
              className="live-thumbnail"
            />
            <div className="live-info">
              <p>{channel.title}</p>
              <p>{channel.viewers} viewers</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveGrid;
