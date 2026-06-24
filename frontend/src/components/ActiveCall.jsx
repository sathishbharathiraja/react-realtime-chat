import React, { useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Expand } from 'lucide-react';

export default function ActiveCall({ 
  callState, 
  localVideoRef, 
  remoteVideoRef, 
  isAudioMuted, 
  isVideoMuted, 
  onToggleAudio, 
  onToggleVideo, 
  onEndCall 
}) {
  if (callState === 'idle' || callState === 'ringing') return null;

  return (
    <div className="absolute inset-x-0 top-14 bottom-0 bg-gray-900 z-50 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Remote Video Container */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {callState === 'calling' ? (
          <div className="text-white text-xl font-medium animate-pulse">Calling...</div>
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
      <div className="absolute top-6 right-6 w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700 z-10">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : 'block'} scale-x-[-1]`}
        />
        {isVideoMuted && (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <VideoOff className="w-8 h-8 text-gray-500" />
          </div>
        )}
      </div>

      {/* Call Controls Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-gray-700 shadow-2xl z-20">
        
        <button 
          onClick={onToggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isAudioMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }`}
          title={isAudioMuted ? "Unmute" : "Mute"}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button 
          onClick={onToggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }`}
          title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <div className="w-px h-8 bg-gray-700 mx-2"></div>

        <button 
          onClick={onEndCall}
          className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all hover:scale-105 shadow-lg hover:shadow-red-500/30 text-white"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
