import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Headphones } from 'lucide-react';

export default function ActiveCall({ 
  callState, 
  localStream,
  remoteStreams = {},
  localVideoRef, 
  isAudioMuted, 
  isVideoMuted, 
  onToggleAudio, 
  onToggleVideo, 
  onChangeAudioInput,
  onEndCall 
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');

  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
        setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
      } catch (err) {
        console.error('Error fetching devices', err);
      }
    }
    if (callState === 'connected' || callState === 'calling') {
      getDevices();
      navigator.mediaDevices.addEventListener('devicechange', getDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    }
  }, [callState]);

  const handleOutputChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedOutput(deviceId);
    // Setting audio output sink on all remote videos
    const videoElements = document.querySelectorAll('.remote-video');
    for (const videoEl of videoElements) {
      if (typeof videoEl.setSinkId === 'function') {
        try {
          await videoEl.setSinkId(deviceId);
        } catch (err) {
          console.error('Failed to set audio output', err);
        }
      }
    }
  };

  const handleInputChange = async (e) => {
    const deviceId = e.target.value;
    setSelectedInput(deviceId);
    if (onChangeAudioInput) {
      await onChangeAudioInput(deviceId);
    }
  };

  if (callState === 'idle' || callState === 'ringing') return null;

  const remotePeerIds = Object.keys(remoteStreams);
  const totalParticipants = remotePeerIds.length + 1; // +1 for local

  // Determine grid layout dynamically based on participant count
  let gridCols = 'grid-cols-1';
  let gridRows = 'grid-rows-1';
  if (totalParticipants === 2) {
    gridCols = 'grid-cols-2';
  } else if (totalParticipants <= 4) {
    gridCols = 'grid-cols-2';
    gridRows = 'grid-rows-2';
  } else if (totalParticipants <= 6) {
    gridCols = 'grid-cols-3';
    gridRows = 'grid-rows-2';
  } else {
    gridCols = 'grid-cols-3';
    gridRows = 'grid-rows-3';
  }

  return (
    <div className="absolute inset-0 bg-[#1A1C23]/95 backdrop-blur-3xl z-50 flex flex-col items-center justify-center p-8">
      
      {/* Remote Video Grid Container */}
      <div className={`w-full max-w-7xl h-[85vh] grid gap-4 ${gridCols} ${gridRows}`}>
        
        {/* Local Video Component */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center group">
          <video 
            ref={(node) => {
              if (localVideoRef) localVideoRef.current = node;
              if (node && localStream && node.srcObject !== localStream) {
                node.srcObject = localStream;
              }
            }} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : 'block'} scale-x-[-1]`}
          />
          {isVideoMuted && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-3">
                <VideoOff className="w-8 h-8 text-slate-400" />
              </div>
              <span className="text-white font-medium">You (Camera Off)</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-sm px-3 py-1.5 rounded-lg font-medium shadow-sm">
            You
          </div>
        </div>

        {/* Remote Peers Component */}
        {remotePeerIds.map((peerId) => (
          <div key={peerId} className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center">
            <video 
              ref={(node) => {
                if (node && remoteStreams[peerId] && node.srcObject !== remoteStreams[peerId]) {
                  node.srcObject = remoteStreams[peerId];
                }
              }} 
              autoPlay 
              playsInline 
              className="remote-video w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Waiting State */}
        {callState === 'calling' && remotePeerIds.length === 0 && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-800/50 border border-slate-700 flex flex-col items-center justify-center">
            <div className="text-white text-xl font-medium animate-pulse mb-2">Waiting for others to join...</div>
            <p className="text-slate-400 text-sm">You are the only one in the call right now.</p>
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

        <div className="relative">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              showSettings ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Audio Settings (Bluetooth)"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Settings Popover */}
          {showSettings && (
            <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-4 z-50">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-500" /> Device Settings
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Microphone (Input)</label>
                  <select 
                    value={selectedInput} 
                    onChange={handleInputChange}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                  >
                    <option value="">Default Microphone</option>
                    {audioInputs.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Speaker (Output)</label>
                  <select 
                    value={selectedOutput} 
                    onChange={handleOutputChange}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700"
                  >
                    <option value="">Default Speaker</option>
                    {audioOutputs.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

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
