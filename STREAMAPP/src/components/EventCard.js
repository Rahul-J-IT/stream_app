import { useNavigate } from 'react-router-dom';

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  
  const handleJoinStream = () => {
    navigate(`/stream/${event._id}`);
  };
  
  // Rest of the component code...
}; 