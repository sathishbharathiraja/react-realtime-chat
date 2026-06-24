import { useState, useEffect, useRef } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export function useWebRTC(socket, user) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState('idle'); // 'idle', 'ringing', 'calling', 'connected'
  const [incomingCall, setIncomingCall] = useState(null); // { from, name, signal, conversationId }
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      // Ignore if we are already in a call
      if (callState !== 'idle') return;
      setIncomingCall(data);
      setCallState('ringing');
    };

    const handleCallAccepted = async ({ signal }) => {
      setCallState('connected');
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      }
    };

    const handleCallRejected = () => {
      cleanupCall();
      alert('Call was rejected');
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerRef.current && candidate) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    };

    socket.on('incomingCall', handleIncomingCall);
    socket.on('callAccepted', handleCallAccepted);
    socket.on('callRejected', handleCallRejected);
    socket.on('callEnded', handleCallEnded);
    socket.on('iceCandidate', handleIceCandidate);

    return () => {
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callAccepted', handleCallAccepted);
      socket.off('callRejected', handleCallRejected);
      socket.off('callEnded', handleCallEnded);
      socket.off('iceCandidate', handleIceCandidate);
    };
  }, [socket, callState]);

  const initStream = async (requestVideo = true) => {
    try {
      // Always request both video and audio so we can toggle video on later mid-call
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // If the user requested an audio-only call, immediately disable the video track
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

  const createPeer = (stream, conversationId, isInitiator) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = peer;

    // Add local tracks to peer
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    // Listen for remote tracks
    peer.ontrack = (event) => {
      const [remoteMediaStream] = event.streams;
      setRemoteStream(remoteMediaStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteMediaStream;
      }
    };

    // Send ICE candidates to signaling server
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', { 
          candidate: event.candidate, 
          conversationId 
        });
      }
    };

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        cleanupCall();
      }
    };

    return peer;
  };

  const startCall = async (conversationId, isVideo = true) => {
    if (!socket) return;
    const stream = await initStream(isVideo);
    if (!stream) return;

    setActiveConversationId(conversationId);
    setCallState('calling');

    const peer = createPeer(stream, conversationId, true);

    // Create Offer
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit('callUser', {
      conversationId,
      signalData: offer,
      from: user.id,
      name: user.displayName
    });
  };

  const answerCall = async () => {
    if (!incomingCall || !socket) return;
    const stream = await initStream(true); // Default to video on answer for simplicity, user can toggle
    if (!stream) return;

    const { conversationId, signal } = incomingCall;
    setActiveConversationId(conversationId);
    setCallState('connected');

    const peer = createPeer(stream, conversationId, false);

    // Set Remote Offer
    await peer.setRemoteDescription(new RTCSessionDescription(signal));

    // Create Answer
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit('answerCall', {
      signal: answer,
      conversationId
    });

    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('rejectCall', { conversationId: incomingCall.conversationId });
    }
    setIncomingCall(null);
    setCallState('idle');
  };

  const endCall = () => {
    if (activeConversationId && socket) {
      socket.emit('endCall', { conversationId: activeConversationId });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setIncomingCall(null);
    setActiveConversationId(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
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
      
      if (localStream) {
        const oldAudioTrack = localStream.getAudioTracks()[0];
        if (oldAudioTrack) {
          localStream.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
        }
        localStream.addTrack(newAudioTrack);
        newAudioTrack.enabled = !isAudioMuted;
      }
      
      if (peerRef.current) {
        const sender = peerRef.current.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newAudioTrack);
        }
      }
    } catch (err) {
      console.error('Failed to change audio input', err);
      alert('Could not switch microphone.');
    }
  };

  return {
    callState,
    incomingCall,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
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
