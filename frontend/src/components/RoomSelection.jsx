import React, { useState } from 'react';
import { Plus, ArrowRight, LogOut } from 'lucide-react';

export default function RoomSelection({ user, onJoin, onLogout, isConnected }) {
  const [mode, setMode] = useState('choice'); // 'choice' | 'create' | 'join'
  const [joinCode, setJoinCode] = useState('');

  const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    const code = generateRoomCode();
    onJoin(code);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      onJoin(joinCode.trim());
    }
  };

  return (
    <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-lg shadow-sm relative">
      <button 
        onClick={onLogout}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
        title="Logout"
      >
        <LogOut className="w-5 h-5" />
      </button>

      <div className="text-center mb-8 mt-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Hi, {user.displayName}</h1>
        <p className="text-sm text-gray-500">
          {isConnected ? 'Ready to chat.' : 'Connecting to server...'}
        </p>
      </div>

      {mode === 'choice' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode('create')}
            disabled={!isConnected}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Room
          </button>
          <button
            onClick={() => setMode('join')}
            disabled={!isConnected}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Join Room
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <p className="text-sm text-gray-600 text-center mb-4">
            You will generate a new 6-digit room code to share.
          </p>
          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Room
          </button>
          <button
            type="button"
            onClick={() => setMode('choice')}
            className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
          >
            Back
          </button>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 text-center tracking-widest text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123456"
              maxLength={6}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={joinCode.length !== 6}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Enter Room
          </button>
          <button
            type="button"
            onClick={() => setMode('choice')}
            className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}
