import React, { useState, useEffect } from 'react';
import { Headphones, Users, Video, Phone, Plus, Clock, PhoneMissed, PhoneIncoming, PhoneOutgoing, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function CallsView({ conversations, socket, token }) {
  const [huddles, setHuddles] = useState({});
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!token) return;
    fetch(`${backendUrl}/api/calls`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCallHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const joinHuddle = (convId) => {
    socket.emit('joinHuddle', { conversationId: convId });
  };

  const leaveHuddle = (convId) => {
    socket.emit('leaveHuddle', { conversationId: convId });
  };

  const teamConvs = conversations.filter(c => c.isGroup);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 bg-slate-50/50 h-full overflow-hidden">
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

          <h3 className="text-lg font-bold text-slate-700 mb-4 mt-8 flex items-center gap-2 border-t border-slate-100 pt-8">
            <Clock className="w-5 h-5 text-indigo-500" /> Recent History
          </h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading history...</div>
            ) : callHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No recent calls.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {callHistory.map(call => {
                  const isMissed = call.status === 'missed';
                  const isCaller = call.caller?._id === socket?.user?._id;
                  
                  // For 1-on-1, determine the other participant's name
                  let title = call.conversationId?.name;
                  if (!call.conversationId?.isGroup && call.conversationId?.participants) {
                    const otherUser = call.conversationId.participants.find(p => p._id !== socket?.user?._id) || call.caller;
                    title = otherUser?.displayName || 'User';
                  }

                  const startDate = new Date(call.startTime);
                  const duration = call.endTime ? Math.round((new Date(call.endTime) - startDate) / 1000) : null;
                  const minutes = duration ? Math.floor(duration / 60) : 0;
                  const seconds = duration ? duration % 60 : 0;

                  return (
                    <div key={call._id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isMissed ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                          {isMissed ? <PhoneMissed className="w-5 h-5" /> : isCaller ? <PhoneOutgoing className="w-5 h-5" /> : <PhoneIncoming className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`font-bold truncate text-base ${isMissed ? 'text-red-600' : 'text-slate-800'}`}>
                            {title || 'Unknown Call'}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {call.status === 'completed' && duration !== null && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{minutes > 0 ? `${minutes}m ` : ''}{seconds}s</span>
                              </>
                            )}
                            {call.status === 'ongoing' && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-green-500 font-semibold">Ongoing</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          if (call.conversationId?.isGroup) {
                            joinHuddle(call.conversationId._id);
                          } else {
                            // Focus chat to easily call back
                            navigate(`/chat/${call.conversationId._id}`);
                          }
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shrink-0 border border-slate-100"
                        title="Call Back"
                      >
                        {call.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
