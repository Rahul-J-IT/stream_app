import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ChatBox from './ChatBox';
import axios from 'axios';



const ViewStreamPage = () => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streamEnded, setStreamEnded] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  // Handle fullscreen
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Update fullscreen state on change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const connectToStream = async () => {
      try {
        // First get the stream details
        const response = await axios.get(`http://localhost:3001/api/streams`);
        console.log('Available streams:', response.data.streams);
        
        // Find active stream for this event
        const stream = response.data.streams.find(s => 
          s.streamerId === eventId && s.isLive
        );
        
        if (!stream) {
          console.log('No active stream found for event:', eventId);
          setError('Stream not yet started');
          return;
        }

        console.log('Found stream:', stream);
        const streamId = stream.id;

        // Create peer connection with options
        const peerConnection = new RTCPeerConnection({
          ...configuration,
          sdpSemantics: 'unified-plan',
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require'
        });
        
        peerConnectionRef.current = peerConnection;

        // Update the ontrack handler
        peerConnection.ontrack = (event) => {
          console.log('Received stream track:', event);
          if (videoRef.current && event.streams[0]) {
            const stream = event.streams[0];
            videoRef.current.srcObject = stream;
            
            // Ensure audio tracks are enabled
            stream.getAudioTracks().forEach(track => {
              track.enabled = true;
              console.log('Audio track enabled:', track.readyState);
            });

            // Set up video element
            videoRef.current.muted = false;
            videoRef.current.volume = 1;
            setVolume(1);
            setIsMuted(false);

            // Try to play with audio
            videoRef.current.play().catch(e => {
              console.error('Error playing video:', e);
              // Show play button if autoplay fails
              setError('Click to enable audio');
            });
          }
        };

        peerConnection.oniceconnectionstatechange = () => {
          const state = peerConnection.iceConnectionState;
          console.log('ICE Connection State:', state);
          
          if (state === 'failed' || state === 'disconnected') {
            console.log('Attempting to restart ICE');
            peerConnection.restartIce();
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('Sending ICE candidate to broadcaster');
            socketRef.current.emit('ice-candidate', {
              candidate: event.candidate,
              targetId: socketRef.current.broadcasterId,
              streamId
            });
          }
        };

        // Connect to Socket.IO server
        const socket = io('http://localhost:3001', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        socket.on('connect', () => {
          console.log('Connected to server');
          setSocketConnected(true);
          socket.emit('join-stream', { streamId });
        });

        socketRef.current = socket;

        socket.on('offer', async ({ offer, broadcasterId }) => {
          console.log('Received offer from broadcaster:', broadcasterId);
          socketRef.current.broadcasterId = broadcasterId;
          
          try {
            const remoteDesc = new RTCSessionDescription(offer);
            await peerConnection.setRemoteDescription(remoteDesc);
            console.log('Remote description set');
            
            const answer = await peerConnection.createAnswer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
            
            await peerConnection.setLocalDescription(answer);
            console.log('Local description set');
            
            socket.emit('answer', {
              answer,
              broadcasterId,
              streamId
            });
          } catch (error) {
            console.error('Error handling offer:', error);
          }
        });

        socket.on('ice-candidate', async ({ candidate, senderId }) => {
          console.log('Received ICE candidate from:', senderId);
          if (candidate && peerConnection.remoteDescription) {
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('Added ICE candidate');
            } catch (e) {
              console.error('Error adding received ice candidate:', e);
            }
          } else {
            console.log('Queuing ICE candidate');
          }
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from server');
          setSocketConnected(false);
          if (socket.role === 'viewer') {
            setError('Connection lost. The stream may have ended.');
            setStreamEnded(true);
            
            // Clean up
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
            }
          }
        });

        socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          setError('Connection error. Please try again.');
        });

        // Update chat messages to use streamId
        socket.on('chat-message', (message) => {
          if (message.streamId === streamId) {
            setMessages(prev => [...prev, message]);
          }
        });

        socket.on('stream-ended', () => {
          console.log('Stream has ended');
          setStreamEnded(true);
          setError('Stream has ended. The broadcaster has stopped streaming.');
          
          // Clean up video stream
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
          
          // Close peer connection
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
          }
        });

      } catch (error) {
        console.error('Error connecting to stream:', error);
        setError('Failed to connect to stream');
      }
    };

    connectToStream();

    return () => {
      if (socketRef.current) {
        setSocketConnected(false);
        socketRef.current.disconnect();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [eventId]);

  useEffect(() => {
    // Function to handle user interaction
    const handleUserInteraction = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(console.error);
      }
      // Remove the event listener once it's been used
      document.removeEventListener('click', handleUserInteraction);
    };

    // Add the event listener
    document.addEventListener('click', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  const endStream = async () => {
    try {
      // ... existing stream end code ...

      // Update event streaming status
      await axios.post(`http://localhost:5000/api/events/${eventId}/end-streaming`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Stream ended and event updated');
      // ... rest of your stream end logic ...
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Viewing Stream</h2>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '20px',
        maxWidth: '1400px', 
        margin: '0 auto'
      }}>
        <div style={{ 
          flex: '1',
          marginBottom: '20px' 
        }}>
          {error === 'Stream not yet started' ? (
            <div style={{
              width: '100%',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#1a1a1a',
              color: 'white',
              borderRadius: '8px',
              padding: '40px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ 
                fontSize: '28px', 
                marginBottom: '20px',
                color: '#4444ff'
              }}>
                Stream Not Started
              </h2>
              <p style={{ 
                fontSize: '18px', 
                marginBottom: '30px',
                color: '#cccccc'
              }}>
                The broadcaster hasn't started streaming yet. Please check back later.
              </p>
              <button 
                onClick={() => navigate('/browse')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4444ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.2s',
                  marginTop: '20px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#3333cc'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4444ff'}
              >
                Return to Browse
              </button>
            </div>
          ) : streamEnded ? (
            <div style={{
              width: '100%',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#1a1a1a',
              color: 'white',
              borderRadius: '8px',
              padding: '40px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ 
                fontSize: '28px', 
                marginBottom: '20px',
                color: '#ff4444'
              }}>
                Stream Has Ended
              </h2>
              <p style={{ 
                fontSize: '18px', 
                marginBottom: '30px',
                color: '#cccccc'
              }}>
                The broadcaster has ended this stream session.
              </p>
              <button 
                onClick={() => navigate('/browse')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4444ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.2s',
                  marginTop: '20px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#3333cc'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4444ff'}
              >
                Return to Browse
              </button>
            </div>
          ) : (
            <div 
              ref={videoContainerRef}
              style={{ 
                position: 'relative',
                width: '100%',
                backgroundColor: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                ...(isFullscreen && {
                  height: '100vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                })
              }}
            >
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ 
                  width: '100%',
                  height: isFullscreen ? '100vh' : '75vh',
                  maxHeight: isFullscreen ? 'none' : '75vh',
                  backgroundColor: '#000',
                  objectFit: isFullscreen ? 'contain' : 'cover'
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                    videoRef.current.volume = 1;
                    videoRef.current.play().catch(console.error);
                  }
                }}
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                    videoRef.current.volume = 1;
                    videoRef.current.play().catch(console.error);
                  }
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                opacity: '0',
                transition: 'opacity 0.3s',
                zIndex: 1000
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                {/* Volume Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handleMuteToggle}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '5px'
                    }}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{
                      width: '100px',
                      accentColor: '#4444ff'
                    }}
                  />
                </div>

                
               

                {/* Fullscreen Button */}
                <button
                  onClick={handleFullscreen}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '5px',
                    marginLeft: 'auto'
                  }}
                >
                  {isFullscreen ? '⤓' : '⤢'}
                </button>
              </div>
            </div>
          )}
        </div>
        {socketRef.current && (
          <div style={{ width: '300px' }}>
            <ChatBox 
              socket={socketRef.current} 
              eventId={eventId}
              isBroadcaster={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewStreamPage; 