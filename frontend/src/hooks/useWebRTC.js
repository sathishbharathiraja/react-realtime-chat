import { useState, useEffect, useRef } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export function useWebRTC(socket, user) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const [callState, setCallState] = useState('idle'); // 'idle', 'connected'
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // We no longer have 'incomingCall' state because in a Huddle, you just join without ringing.
  const [incomingCall, setIncomingCall] = useState(null);

  const peersRef = useRef({}); // { socketId: RTCPeerConnection }
  const localVideoRef = useRef(null); // Ref for local video
  const localStreamRef = useRef(null); // to keep track inside effects

  const initStream = async (requestVideo = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        if (!requestVideo) {
          videoTrack.enabled = false;
          setIsVideoMuted(true);
        } else {
          videoTrack.enabled = true;
          setIsVideoMuted(false);
        }
      }

      setLocalStream(stream);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      alert('Could not access camera/microphone. Please allow permissions.');
      return null;
    }
  };

  const removePeer = (socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
    setRemoteStreams(prev => {
      const newStreams = { ...prev };
      delete newStreams[socketId];
      return newStreams;
    });
  };

  const createPeer = (socketId, stream, isInitiator, conversationId) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[socketId] = peer;

    if (stream) {
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    }

    peer.ontrack = (event) => {
      const [remoteMediaStream] = event.streams;
      setRemoteStreams(prev => ({ ...prev, [socketId]: remoteMediaStream }));
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', { 
          to: socketId, 
          candidate: event.candidate, 
          conversationId 
        });
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        removePeer(socketId);
      }
    };

    return peer;
  };

  const startCall = async (conversationId, isVideo = true) => {
    if (!socket) return;
    const stream = await initStream(isVideo);
    if (!stream) return;

    setActiveConversationId(conversationId);
    setCallState('connected');
    
    // Notify others in the group that a call is ringing
    socket.emit('ringGroup', { conversationId, callerName: user.displayName });
    
    socket.emit('joinHuddle', { conversationId });
  };

  const answerCall = async () => {
    if (!incomingCall || !socket) return;
    const { conversationId } = incomingCall;
    
    setIncomingCall(null);
    setCallState('connected');
    setActiveConversationId(conversationId);

    const stream = await initStream(true);
    if (!stream) return;

    socket.emit('joinHuddle', { conversationId });
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('endCall', { conversationId: incomingCall.conversationId, missed: true });
    }
    setIncomingCall(null);
    setCallState('idle');
  };

  const endCall = () => {
    if (activeConversationId && socket) {
      socket.emit('leaveHuddle', { conversationId: activeConversationId });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    Object.keys(peersRef.current).forEach(socketId => {
      removePeer(socketId);
    });
    
    if (activeConversationId && callState === 'connected') {
      socket.emit('endCall', { conversationId: activeConversationId, missed: false });
    }
    
    peersRef.current = {};
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStreams({});
    setCallState('idle');
    setActiveConversationId(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const changeAudioInput = async (deviceId) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false
      });
      const newAudioTrack = newStream.getAudioTracks()[0];
      
      if (localStreamRef.current) {
        const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
        if (oldAudioTrack) {
          localStreamRef.current.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
        }
        localStreamRef.current.addTrack(newAudioTrack);
        newAudioTrack.enabled = !isAudioMuted;
      }
      
      Object.values(peersRef.current).forEach(async (peer) => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newAudioTrack);
        }
      });
    } catch (err) {
      console.error('Failed to change audio input', err);
      alert('Could not switch microphone.');
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleHuddlePeers = async (existingPeers) => {
      for (const peerData of existingPeers) {
        const peer = createPeer(peerData.socketId, localStreamRef.current, true, activeConversationId);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('callUser', {
          userToCall: peerData.socketId,
          signalData: offer,
          from: socket.id,
          name: user.displayName,
          conversationId: activeConversationId
        });
      }
    };

    const handleIncomingCall = async ({ signal, from, name, conversationId }) => {
      const peer = createPeer(from, localStreamRef.current, false, conversationId);
      await peer.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('answerCall', { to: from, signal: answer, conversationId });
    };

    const handleCallAccepted = async ({ signal, from }) => {
      const peer = peersRef.current[from];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(signal));
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      const peer = peersRef.current[from];
      if (peer && candidate) {
        try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } 
        catch(e) { console.error(e); }
      }
    };

    const handleUserLeft = ({ socketId }) => {
      removePeer(socketId);
    };

    const handleGroupRinging = ({ conversationId, callerName }) => {
      if (callState !== 'idle') return;
      setIncomingCall({ conversationId, name: callerName });
      setCallState('ringing');
    };

    socket.on('huddlePeers', handleHuddlePeers);
    socket.on('incomingCall', handleIncomingCall);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('userLeftHuddle', handleUserLeft);
    socket.on('groupRinging', handleGroupRinging);

    return () => {
      socket.off('huddlePeers', handleHuddlePeers);
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('userLeftHuddle', handleUserLeft);
      socket.off('groupRinging', handleGroupRinging);
    };
  }, [socket, activeConversationId, user.displayName, callState]);

  return {
    callState,
    incomingCall,
    localStream,
    remoteStreams,
    localVideoRef,
    isAudioMuted,
    isVideoMuted,
    activeConversationId,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    changeAudioInput
  };
}
