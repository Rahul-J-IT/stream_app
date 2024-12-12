import { Link } from 'react-router-dom';

const Browse = () => {
  return (
    <div>
      {events.map(event => (
        <Link to={`/stream/${event._id}`} key={event._id}>
          {/* Event content */}
        </Link>
      ))}
    </div>
  );
}; 