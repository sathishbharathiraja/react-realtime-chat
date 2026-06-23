import React, { useState } from 'react';
import { Plus, ArrowRight, LogOut } from 'lucide-react';

export default function RoomSelection({ user, onJoin, onLogout, isConnected }) {
  const [mode, setMode] = useState('choice'); // 'choice' | 'create' | 'join'
  const [joinCode, setJoinCode] = useState('');

  const [generatedCode, setGeneratedCode] = useState('');

  const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!generatedCode) {
      setGeneratedCode(generateRoomCode());
    } else {
      onJoin(generatedCode);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      onJoin(joinCode.trim());
    }
  };

  return (
    <div className="w-full max-w-[420px] p-8 clean-card relative">
      <button 
        onClick={onLogout}
        className="absolute top-5 right-5 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors z-20"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center px-3 py-1 mb-4 rounded-full bg-gray-50 border border-gray-200">
          <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome, {user.displayName}</h1>
        <p className="text-sm text-gray-500">What would you like to do?</p>
      </div>

      <div className="min-h-[160px]">
        {mode === 'choice' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <button
              onClick={() => setMode('create')}
              disabled={!isConnected}
              className="w-full group relative flex justify-between items-center px-6 py-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-sm disabled:opacity-50 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-900 font-semibold">Create Room</div>
                  <div className="text-xs text-gray-500">Start a new chat</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </button>
            
            <button
              onClick={() => setMode('join')}
              disabled={!isConnected}
              className="w-full group relative flex justify-between items-center px-6 py-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-sm disabled:opacity-50 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-gray-900 font-semibold">Join Room</div>
                  <div className="text-xs text-gray-500">Enter a code</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-6 animate-fade-in">
            {!generatedCode ? (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <div className="w-12 h-12 mx-auto bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-900 font-medium mb-1">Create a New Room</p>
                <p className="text-xs text-gray-500">Generate a unique 6-digit code to share.</p>
              </div>
            ) : (
              <div className="p-6 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                <p className="text-sm text-indigo-900 font-medium mb-3">Your Room Code:</p>
                <div className="text-4xl font-mono font-bold text-indigo-700 tracking-[0.2em] mb-2">{generatedCode}</div>
                <p className="text-xs text-indigo-600/80">Share this code with your friends so they can join.</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {!generatedCode ? 'Generate Code' : 'Enter Room'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('choice'); setGeneratedCode(''); }}
              className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Enter Room Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-4 bg-white border border-gray-300 rounded-xl text-center tracking-[0.5em] text-3xl font-mono text-gray-900 placeholder-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="------"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={joinCode.length !== 6}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              Join Room
            </button>
            <button
              type="button"
              onClick={() => setMode('choice')}
              className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
