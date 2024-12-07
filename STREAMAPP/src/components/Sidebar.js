import React from 'react';
import './App.css';

const channels = [
  { name: 'tarik', game: 'VALORANT', viewers: '23.9K' },
  { name: 'TenZ', game: 'VALORANT', viewers: '21.3K' },
  { name: 'shanks_ttv', game: 'VALORANT', viewers: '2.1K' },
  // Add more channels here...
];

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>Recommended Channels</h2>
      <ul className="channel-list">
        {channels.map((channel, index) => (
          <li key={index}>
            <div className="channel-info">
              <span>{channel.name}</span>
              <span>{channel.viewers} viewers</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
