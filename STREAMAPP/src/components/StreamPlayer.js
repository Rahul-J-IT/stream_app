import React from 'react';
import { useLocation } from 'react-router-dom';

const StreamPlayer = () => {
  const location = useLocation();
  const { stream } = location.state || {};

  if (!stream) {
    return <div>No stream selected</div>;
  }

  return (
    <div className="stream-player">
      <h3>Now Streaming: {stream.title}</h3>
      <iframe
        src={`https://player.twitch.tv/?channel=${stream.channel}&parent=localhost`}
        height="480"
        width="720"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default StreamPlayer;
//g4g3n0geclqjvymph2dv9cn3us36dk
//fbd0jyq0b40dam94c23f6qv351p4b9