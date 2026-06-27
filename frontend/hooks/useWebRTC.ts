import { useState, useEffect, useRef, useCallback } from 'react';

// STUN servers for NAT traversal
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC(roomId: string, currentUser: string, socketRef: React.MutableRefObject<WebSocket | null>) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [username: string]: MediaStream }>({});
  const [inCall, setInCall] = useState(false);
  const inCallRef = useRef(false);
  
  const peerConnections = useRef<{ [username: string]: RTCPeerConnection }>({});

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setInCall(true);
      inCallRef.current = true;
      
      // Announce to the room that we joined
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "join_call",
          data: {}
        }));
      }
    } catch (err) {
      console.error("Failed to get local stream", err);
      alert("Could not access camera/microphone");
    }
  }, [socketRef]);

  const leaveCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStreams({});
    setInCall(false);
    inCallRef.current = false;
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "leave_call",
        data: {}
      }));
    }
  }, [localStream, socketRef]);

  const createPeerConnection = useCallback((targetUsername: string, isInitiator: boolean) => {
    if (peerConnections.current[targetUsername]) {
      return peerConnections.current[targetUsername];
    }

    const pc = new RTCPeerConnection(iceServers);
    peerConnections.current[targetUsername] = pc;

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "webrtc_ice_candidate",
          data: {
            target_username: targetUsername,
            candidate: event.candidate
          }
        }));
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [targetUsername]: event.streams[0]
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[targetUsername];
          return next;
        });
        delete peerConnections.current[targetUsername];
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then(offer => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "webrtc_offer",
              data: {
                target_username: targetUsername,
                offer: offer
              }
            }));
          }
          return pc.setLocalDescription(offer);
        })
        .catch(console.error);
    }

    return pc;
  }, [localStream, socketRef]);

  const handleSignalingData = useCallback(async (msg: any) => {
    if (!inCallRef.current) return;

    const { type, data } = msg;
    const sender = data.sender_username;
    const target = data.target_username;

    // Ignore our own broadcasts
    if (sender === currentUser) return;

    switch (type) {
      case "join_call":
        // Someone joined, we should initiate a connection to them
        createPeerConnection(sender, true);
        break;

      case "leave_call":
        if (peerConnections.current[sender]) {
          peerConnections.current[sender].close();
          delete peerConnections.current[sender];
          setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[sender];
            return next;
          });
        }
        break;

      case "webrtc_offer":
        if (target !== currentUser) return;
        const pcOffer = createPeerConnection(sender, false);
        await pcOffer.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pcOffer.createAnswer();
        
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "webrtc_answer",
            data: {
              target_username: sender,
              answer: answer
            }
          }));
        }
        await pcOffer.setLocalDescription(answer);
        break;

      case "webrtc_answer":
        if (target !== currentUser) return;
        const pcAnswer = peerConnections.current[sender];
        if (pcAnswer) {
          await pcAnswer.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
        break;

      case "webrtc_ice_candidate":
        if (target !== currentUser) return;
        const pcIce = peerConnections.current[sender];
        if (pcIce) {
          try {
            await pcIce.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error("Error adding ice candidate", e);
          }
        }
        break;
    }
  }, [currentUser, createPeerConnection, socketRef]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      leaveCall();
    };
  }, [leaveCall]);

  return {
    localStream,
    remoteStreams,
    inCall,
    startCall,
    leaveCall,
    handleSignalingData
  };
}
