import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';

export default function IncomingCallModal({ incomingCall, onAccept, onReject }) {
  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[320px] flex flex-col items-center animate-slide-up">
        
        {/* Pulsing Avatar */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-white text-3xl font-bold">
            {incomingCall.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-1">{incomingCall.name}</h3>
        <p className="text-gray-500 font-medium mb-8">Incoming video call...</p>

        <div className="flex w-full justify-center gap-8">
          <button 
            onClick={onReject}
            className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg hover:shadow-red-500/30"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
          
          <button 
            onClick={onAccept}
            className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg hover:shadow-green-500/30 animate-bounce"
          >
            <Phone className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
