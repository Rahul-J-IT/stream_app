import React, { useState, useRef, useEffect } from 'react';

const ChatBox = ({ socket, eventId, isBroadcaster }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const username = localStorage.getItem('username') || (isBroadcaster ? 'Broadcaster' : 'Viewer');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!socket) {
      console.log('Socket not initialized');
      return;
    }

    // Listen for chat messages
    socket.on('chat-message', (message) => {
      console.log('Received chat message:', message);
      setMessages(prevMessages => [...prevMessages, message]);
      scrollToBottom();
    });

    return () => {
      if (socket) {
        socket.off('chat-message');
      }
    };
  }, [socket]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!socket || !newMessage.trim()) return;

    const messageData = {
      eventId,
      text: newMessage.trim(),
      username,
      timestamp: new Date().toISOString(),
      isBroadcaster
    };

    console.log('Sending message:', messageData);
    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  return (
    <div style={{
      width: '100%',
      height: '75vh',
      border: '1px solid #ccc',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fff'
    }}>
      <div style={{
        padding: '10px',
        borderBottom: '1px solid #ccc',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem',color:'#4444ff' }}>Live Chat</h3>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            backgroundColor: msg.isBroadcaster ? '#ffebee' : '#f5f5f5',
            padding: '8px',
            borderRadius: '8px',
            maxWidth: '90%',
            alignSelf: msg.username === username ? 'flex-end' : 'flex-start',
            wordBreak: 'break-word'
          }}>
            <div style={{
              fontSize: '0.8em',
              color: msg.isBroadcaster ? '#c62828' : '#666',
              fontWeight: msg.isBroadcaster ? 'bold' : 'normal',
              marginBottom: '4px'
            }}>
              {msg.username} {msg.isBroadcaster && '(Broadcaster)'}
            </div>
            <div>{msg.text}</div>
            <div style={{
              fontSize: '0.7em',
              color: '#999',
              marginTop: '4px'
            }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{
        padding: '10px',
        borderTop: '1px solid #ccc',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#4444ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox; 