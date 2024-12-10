import React, { useState, useRef, useEffect } from 'react';

const ChatBox = ({ socket, eventId, isBroadcaster }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiSection, setShowEmojiSection] = useState(false);
  const messagesEndRef = useRef(null);
  const username = localStorage.getItem('username') || (isBroadcaster ? 'Broadcaster' : 'Viewer');

  // Grouped Emojis
  const emojiGroups = {
    Smileys: ['😀', '😂', '😍', '😢', '😎', '🤔', '😅', '😊', '😇'],
    Animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🦁'],
    Food: ['🍎', '🍔', '🍕', '🍩', '🍦', '🍉', '🍇', '🥕', '🌭'],
    Activities: ['⚽', '🏀', '🏈', '🎾', '🏓', '🎮', '🎸', '🎯', '🎤'],
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!socket) {
      console.log('Socket not initialized');
      return;
    }

    socket.on('chat-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
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
      isBroadcaster,
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e);
    }
  };

  return (
    <div
      style={{
        width: '320px',
        height: '80vh',
        bottom: '50px',
        right: '20px',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#18181b',
        border: '1px solid #333',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '50px',
          background: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h3 style={{ margin: 0, color: 'white', fontSize: '16px' }}>STREAM CHAT</h3>
      </div>

      {/* Chat Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          background: '#2d2f33',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              alignSelf: msg.username === username ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '8px 12px',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              wordWrap: 'break-word',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              background: 'transparent',
              border: '1px solid #333',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {msg.isBroadcaster
                ? `Broadcaster : ${msg.text}`
                : `${msg.username}: ${msg.text}`}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div
        style={{
          padding: '10px',
          background: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#2d2f33',
              color: 'white',
            }}
          />
          <button
            onClick={() => setShowEmojiSection((prev) => !prev)}
            style={{
              background: '#5865f2',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            😀
          </button>
        </div>
        <button
          onClick={handleSendMessage}
          style={{
            background: '#5865f2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Send Message
        </button>
      </div>

      {/* Emoji Section */}
      {showEmojiSection && (
        <div
          style={{
            background: '#2d2f33',
            color: 'white',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {Object.entries(emojiGroups).map(([category, emojis]) => (
            <div key={category}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>{category}</h4>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '5px 0',
                }}
              >
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatBox;
