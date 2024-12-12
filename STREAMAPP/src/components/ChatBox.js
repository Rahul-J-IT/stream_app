import React, { useState, useRef, useEffect } from 'react';

const ChatBox = ({ socket, eventId, isBroadcaster, onCollapseChange }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiSection, setShowEmojiSection] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const messagesEndRef = useRef(null);
  const username = localStorage.getItem('username') || (isBroadcaster ? 'Broadcaster' : 'Viewer');

  // Your existing emoji groups and functions...

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

  const handleCollapseClick = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  return (
    <div style={{
      position: "relative",
      right: 0,
      top: '270px',
      marginRight:"15px",
      transform: 'translateY(-50%)',
      width: collapsed ? '40px' : '320px',
      height: '80vh',
      display: 'flex',
      flexDirection: 'column',
      background: collapsed ? 'transparent' : '#18181b',
      border: collapsed ? 'none' : '1px solid #333',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: collapsed ? 'none' : '0 4px 8px rgba(0, 0, 0, 0.2)',
      zIndex: 1000,
    }}>
      {collapsed ? (
        // Message Icon when collapsed
        <button
          onClick={handleCollapseClick}
          className="collapse-button"
          style={{
            background: 'rgba(24, 24, 27, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '24px',
          }}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Chat Header */}
          <div style={{
            height: '50px',
            background: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            borderBottom: '1px solid #333',
          }}>
            <h3 style={{ marginLeft:'70px', color: 'white', fontSize: '16px' }}>STREAM CHAT</h3>
            <button
              onClick={handleCollapseClick}
              style={{
                background: 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>

          {/* Messages Section */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
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
          <div style={{
            padding: '10px',
            background: '#1f2937',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              width: '100%',
            }}>
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

            {/* Emoji Section */}
            {showEmojiSection && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                background: '#2d2f33',
                color: 'white',
                padding: '10px',
                maxHeight: '200px',
                overflowY: 'auto',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
              }}>
                {Object.entries(emojiGroups).map(([category, emojis]) => (
                  <div key={category}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>
                      {category}
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      padding: '5px 0',
                    }}>
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
        </div>
      )}
    </div>
  );
};

export default ChatBox;