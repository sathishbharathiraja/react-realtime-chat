import React, { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function JoinScreen({ onJoin, isConnected }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('choice'); // 'choice' | 'create' | 'join'
  const [joinCode, setJoinCode] = useState('');

  const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (name.trim()) {
      const code = generateRoomCode();
      onJoin(name.trim(), code);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (name.trim() && joinCode.trim().length === 6) {
      onJoin(name.trim(), joinCode.trim());
    }
  };

  return (
    <div className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome</h1>
        <p className="text-sm text-gray-500">
          {isConnected ? 'Connected to server.' : 'Connecting to server...'}
        </p>
      </div>

      {mode === 'choice' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your name"
              required
              autoFocus
              maxLength={32}
              disabled={!isConnected}
            />
          </div>
          
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setMode('create')}
              disabled={!isConnected || !name.trim()}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Room
            </button>
            <button
              onClick={() => setMode('join')}
              disabled={!isConnected || !name.trim()}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Join Room
            </button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <p className="text-sm text-gray-600 text-center mb-4">
            You will generate a new 6-digit room code to share.
          </p>
          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          >
            Start Room
          </button>
          <button
            type="button"
            onClick={() => setMode('choice')}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div>
            <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-1">
              Room Code
            </label>
            <input
              id="joinCode"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 text-center tracking-widest text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="123456"
              maxLength={6}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={joinCode.length !== 6}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
