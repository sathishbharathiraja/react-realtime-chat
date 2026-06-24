import React, { useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

export default function ActiveCall({ 
  callState, 
  localStream,
  remoteStream,
  localVideoRef, 
  remoteVideoRef, 
  isAudioMuted, 
  isVideoMuted, 
  onToggleAudio, 
  onToggleVideo, 
  onEndCall 
}) {
  // Attach streams dynamically to ensure they render even if the component mounts after initialization
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef]);

  if (callState === 'idle' || callState === 'ringing') return null;

  return (
    <div className="absolute inset-0 bg-[#F4F5F7]/95 backdrop-blur-3xl z-50 flex flex-col items-center justify-center overflow-hidden rounded-[24px]">
      
      {/* Remote Video Container */}
      <div className="relative w-full h-full max-w-5xl max-h-[80vh] bg-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.06)] overflow-hidden border border-slate-100 flex items-center justify-center">
        {callState === 'calling' ? (
          <div className="text-slate-400 text-xl font-medium animate-pulse">Connecting...</div>
        ) : (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Local Video PIP (Picture-in-Picture) */}
      <div className="absolute top-8 right-8 w-56 aspect-video bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-4 border-white z-10">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : 'block'} scale-x-[-1]`}
        />
        {isVideoMuted && (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <VideoOff className="w-8 h-8 text-slate-400" />
          </div>
        )}
      </div>

      {/* Call Controls Bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-xl px-6 py-4 rounded-full border border-slate-200/50 shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-20">
        
        <button 
          onClick={onToggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isAudioMuted ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title={isAudioMuted ? "Unmute" : "Mute"}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button 
          onClick={onToggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isVideoMuted ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <div className="w-px h-8 bg-slate-200 mx-2"></div>

        <button 
          onClick={onEndCall}
          className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-transform hover:scale-105 shadow-lg shadow-red-500/20 text-white"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
