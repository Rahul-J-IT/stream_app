import './App.css';

function MainPlayer() {
  return (
    <div className="main-player">
      <h3>Live Channel Preview</h3>
      <div className="player-wrapper">
      <iframe
  src="https://rahul-j-it.github.io/live-video-stream/lobby.html"
  height="480"
  width="640"
  allowFullScreen
/>

      </div>
    </div>
  );
}

export default MainPlayer;
