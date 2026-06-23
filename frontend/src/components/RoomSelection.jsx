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
    <div className="w-full max-w-[420px] p-8 glass-panel rounded-2xl relative overflow-hidden group">
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-125 pointer-events-none"></div>

      <button 
        onClick={onLogout}
        className="absolute top-5 right-5 p-2 text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-full transition-all duration-300 z-20"
        title="Disconnect Terminal"
      >
        <LogOut className="w-4 h-4" />
      </button>

      <div className="relative z-10 text-center mb-10 mt-2">
        <div className="inline-flex items-center justify-center p-1 px-3 mb-4 rounded-full bg-black/30 border border-white/5 shadow-inner">
          <div className={`w-2 h-2 rounded-full mr-2 shadow-[0_0_8px_currentColor] ${isConnected ? 'bg-cyan-400 text-cyan-400' : 'bg-red-500 text-red-500 animate-pulse'}`}></div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-gray-300">
            {isConnected ? 'System Online' : 'Connecting...'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Welcome, {user.displayName}</h1>
        <p className="text-xs text-gray-400 uppercase tracking-widest">Select Operation Mode</p>
      </div>

      <div className="relative z-10 min-h-[160px]">
        {mode === 'choice' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => setMode('create')}
              disabled={!isConnected}
              className="w-full group/btn relative overflow-hidden flex justify-between items-center px-6 py-5 bg-black/40 border border-white/10 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] disabled:opacity-50 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-lg group-hover/btn:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">Initialize Room</div>
                  <div className="text-xs text-gray-500">Generate secure channel</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover/btn:text-cyan-400 group-hover/btn:-translate-x-1 transition-all" />
            </button>
            
            <button
              onClick={() => setMode('join')}
              disabled={!isConnected}
              className="w-full group/btn relative overflow-hidden flex justify-between items-center px-6 py-5 bg-black/40 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] disabled:opacity-50 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-lg group-hover/btn:scale-110 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">Connect to Room</div>
                  <div className="text-xs text-gray-500">Join via access code</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover/btn:text-indigo-400 group-hover/btn:-translate-x-1 transition-all" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 bg-black/30 border border-cyan-500/20 rounded-xl text-center">
              <div className="w-12 h-12 mx-auto bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-300 mb-2 font-medium">Ready to initialize.</p>
              <p className="text-xs text-gray-500">A secure 6-digit access code will be generated for your channel.</p>
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
            >
              Execute
            </button>
            <button
              type="button"
              onClick={() => setMode('choice')}
              className="w-full text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              Abort Operation
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 text-center">Enter Access Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-4 bg-black/50 border border-indigo-500/30 rounded-xl text-center tracking-[0.5em] text-3xl font-mono text-white placeholder-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.3)] outline-none transition-all"
                placeholder="------"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={joinCode.length !== 6}
              className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
            >
              Connect
            </button>
            <button
              type="button"
              onClick={() => setMode('choice')}
              className="w-full text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              Abort Operation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
