import React, { useState, useEffect } from 'react';
import { Headphones, Users, Video, Phone, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CallsView({ conversations, socket }) {
  const [huddles, setHuddles] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;
    
    const handleHuddles = (data) => {
      setHuddles(data);
    };

    socket.emit('getHuddles');
    socket.on('huddlesList', handleHuddles);

    return () => {
      socket.off('huddlesList', handleHuddles);
    };
  }, [socket]);

  const joinHuddle = (convId) => {
    socket.emit('joinHuddle', { conversationId: convId });
  };

  const leaveHuddle = (convId) => {
    socket.emit('leaveHuddle', { conversationId: convId });
  };

  const teamConvs = conversations.filter(c => c.isGroup);

  return (
    <div className="flex-1 flex flex-col p-8 bg-slate-50/50 h-full overflow-hidden">
      <div className="max-w-5xl w-full mx-auto flex flex-col h-full">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Calls & Huddles</h2>
            <p className="text-slate-500 font-medium">Connect with your team instantly via Audio or Video.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Phone className="w-4 h-4 text-indigo-500" />
              New Audio Call
            </button>
            <button 
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Video className="w-4 h-4" />
              New Video Call
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-500" /> Active Audio Huddles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {teamConvs.length === 0 && (
              <div className="col-span-full p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
                Create a Group Chat to unlock team huddles.
              </div>
            )}
            {teamConvs.map(conv => {
              const activeUsers = huddles[conv._id] || [];
              const isActive = activeUsers.length > 0;
              const inHuddle = activeUsers.find(u => u._id === socket?.user?._id);

              return (
                <div key={conv._id} className={`p-6 rounded-3xl border transition-all ${
                  isActive ? 'bg-white border-indigo-100 shadow-[0_10px_40px_rgba(99,102,241,0.08)]' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-sm'
                }`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${isActive ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                      <Headphones className="w-6 h-6" />
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{conv.name || 'Group Chat'}</h3>
                  
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex -space-x-2">
                      {activeUsers.map((u, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ${
                          isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                        }`} title={u.displayName}>
                          {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-full" /> : u.displayName.charAt(0)}
                        </div>
                      ))}
                      {activeUsers.length === 0 && (
                        <span className="text-sm font-medium text-slate-400">Empty room</span>
                      )}
                    </div>
                    
                    {inHuddle ? (
                      <button onClick={() => leaveHuddle(conv._id)} className="px-4 py-2 rounded-xl font-bold text-sm transition-all bg-red-100 hover:bg-red-200 text-red-600">
                        Leave
                      </button>
                    ) : (
                      <button onClick={() => joinHuddle(conv._id)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        isActive 
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                      }`}>
                        Join
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
