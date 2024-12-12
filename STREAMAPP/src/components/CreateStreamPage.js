import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import ChatBox from './ChatBox';

const CreateStreamPage = () => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const [mediaStream, setMediaStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [socketConnected, setSocketConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const videoContainerRef = useRef(null);

  const getCookie = (name) => {
    const cookieArr = document.cookie.split(';');
    for (let cookie of cookieArr) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) return decodeURIComponent(cookieValue);
    }
    return null;
  };

  const token = getCookie('token');
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Ensure audio tracks are enabled
        stream.getAudioTracks().forEach(track => {
          track.enabled = true;
          console.log('Audio track enabled:', track.label, track.readyState);
        });

        setMediaStream(stream);
      }
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      return null;
    }
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Switch back to camera
        const cameraStream = await startCamera();
        if (cameraStream) {
          // Update all peer connections with camera stream
          Object.values(peerConnectionsRef.current).forEach(pc => {
            cameraStream.getTracks().forEach(track => {
              const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
              if (sender) {
                sender.replaceTrack(track);
              }
            });
          });
          setIsScreenSharing(false);
        }
      } else {
        // Switch to screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true
        });

        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
          setMediaStream(screenStream);
        }

        // Update all peer connections with screen share stream
        Object.values(peerConnectionsRef.current).forEach(pc => {
          screenStream.getTracks().forEach(track => {
            const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            }
          });
        });

        setIsScreenSharing(true);

        // Handle stream stop
        screenStream.getVideoTracks()[0].onended = async () => {
          const cameraStream = await startCamera();
          if (cameraStream) {
            Object.values(peerConnectionsRef.current).forEach(pc => {
              cameraStream.getTracks().forEach(track => {
                const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
                if (sender) {
                  sender.replaceTrack(track);
                }
              });
            });
            setIsScreenSharing(false);
          }
        };
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

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
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    const startStream = async () => {
      try {
        const stream = await startCamera();
        if (!stream) return;

        console.log('Creating stream for event:', eventId);

        // Register stream with backend
        const response = await axios.post('http://localhost:5000/api/streams', {
          title: 'Live Stream',
          streamerId: eventId
        });

        console.log('Stream registration response:', response.data);
        const streamId = response.data.stream.id;
        console.log('Stream created with ID:', streamId);

        // Connect to Socket.IO server
        const socket = io('http://localhost:5000', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });

        socket.on('connect', () => {
          console.log('Connected to server');
          setSocketConnected(true);
          socket.emit('register-broadcaster', { streamId });
        });

        socketRef.current = socket;

        socket.on('connection-established', () => {
          console.log('Connection confirmed by server');
        });

        socket.on('viewer-joined', async ({ viewerId }) => {
          console.log('Viewer joined:', viewerId);
          try {
            const peerConnection = new RTCPeerConnection(configuration);
            peerConnectionsRef.current[viewerId] = peerConnection;

            // Add current stream tracks to peer connection
            const currentStream = videoRef.current.srcObject;
            currentStream.getTracks().forEach(track => {
              console.log('Adding track to peer connection:', track.kind, track.enabled);
              peerConnection.addTrack(track, currentStream);
            });

            // Create and send offer with audio preferences
            const offer = await peerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
              voiceActivityDetection: true
            });

            await peerConnection.setLocalDescription(offer);
            console.log('Created offer with audio:', offer.sdp.includes('m=audio'));

            socket.emit('offer', {
              offer,
              viewerId,
              streamId
            });
          } catch (error) {
            console.error('Error handling viewer join:', error);
          }
        });

        socket.on('answer', async ({ answer, viewerId }) => {
          console.log('Received answer from viewer:', viewerId);
          const peerConnection = peerConnectionsRef.current[viewerId];
          if (peerConnection) {
            try {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
              console.log('Remote description set');
            } catch (error) {
              console.error('Error setting remote description:', error);
            }
          }
        });

        socket.on('ice-candidate', async ({ candidate, senderId }) => {
          console.log('Received ICE candidate from:', senderId);
          const peerConnection = peerConnectionsRef.current[senderId];
          if (peerConnection) {
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('Added ICE candidate');
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
            }
          }
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from server');
        });

        // Update event streaming status
        await axios.post(`http://localhost:5000/api/events/${eventId}/start-streaming`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Stream started and event updated');

      } catch (error) {
        console.error('Error starting stream:', error);
      }
    };

    startStream();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setMediaStream(null);
      }
      if (socketRef.current) {
        setSocketConnected(false);
        socketRef.current.disconnect();
      }
      Object.values(peerConnectionsRef.current).forEach(pc => {
        pc.close();
        pc = null;
      });
    };
  }, [eventId]);

  const handleEndStream = async() => {
    if (mediaStream) {
      // Stop all tracks in the media stream
      mediaStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      
      // Clear the video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      try {
        // Update event streaming status in database
        await axios.post(`http://localhost:5000/api/events/${eventId}/stop-streaming`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Stream ended and event updated');
      } catch (error) {
        console.error('Error stopping stream:', error);
      }
      
      // Notify server that stream is ending
      if (socketRef.current) {
        socketRef.current.emit('end-stream');
      }
      
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => {
        pc.close();
        pc = null;
      });
      
      // Clear the media stream reference
      setMediaStream(null);
      
      navigate('/browse');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Broadcasting Stream</h2>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ flex: '1', marginBottom: '20px',
          transition:"width 0.3s ease",
          width: isChatCollapsed? '100%':"calc(100%-320px)"
         }}>
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
              muted
              style={{ 
                width: '100%',
                height: isFullscreen ? '100vh' : '75vh',
                maxHeight: isFullscreen ? 'none' : '75vh',
                backgroundColor: '#000',
                objectFit: isFullscreen ? 'contain' : 'cover'
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
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {/* Screen Share Button */}
                <button 
                  onClick={handleScreenShare}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '20px',
                    opacity: '0.9',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.opacity = '1'}
                  onMouseLeave={e => e.target.style.opacity = '0.9'}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                >
                  {isScreenSharing ? '🖥' : '📱'}
                </button>

                {/* End Stream Button */}
                <button 
  onClick={handleEndStream}
  style={{
    background: 'none',
    border: 'none',
    color: '#ff4444',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '20px',
    opacity: '0.9',
    transition: 'opacity 0.2s'
  }}
  onMouseEnter={e => e.target.style.opacity = '1'}
  onMouseLeave={e => e.target.style.opacity = '0.9'}
  title="End Stream"
>
⏹
</button>   

                {/* Fullscreen Button */}
                <button
                  onClick={handleFullscreen}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '8px',
                    fontSize: '20px',
                    opacity: '0.9',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.opacity = '1'}
                  onMouseLeave={e => e.target.style.opacity = '0.9'}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? '⤓' : '⤢'}
                </button>
              </div>
            </div>
          </div>
        </div>
        {socketConnected && (
          <div style={{ width: isChatCollapsed ? '50px' : '320px',
            transition:"width 0.3s ease"
           }}>
            <ChatBox 
              socket={socketRef.current} 
              eventId={eventId}
              isBroadcaster={true}
              onCollapseChange={setIsChatCollapsed}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateStreamPage;