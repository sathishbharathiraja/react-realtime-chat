import React, { useState, useEffect } from 'react';
import { Pin, Link as LinkIcon, Clock, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function TeamsView({ conversations, socket, token }) {
  const [activeConvId, setActiveConvId] = useState(null);
  const [pinBoard, setPinBoard] = useState({ status: 'On Track', links: [], deadlines: [] });
  const navigate = useNavigate();

  const teamConvs = conversations.filter(c => c.isGroup);

  useEffect(() => {
    if (teamConvs.length > 0 && !activeConvId) {
      setActiveConvId(teamConvs[0]._id);
      setPinBoard(teamConvs[0].pinBoard || { status: 'On Track', links: [], deadlines: [] });
    }
  }, [teamConvs, activeConvId]);

  useEffect(() => {
    if (!socket || !activeConvId) return;

    const handlePinBoardUpdate = (data) => {
      if (data.conversationId === activeConvId) {
        setPinBoard(data.pinBoard);
      }
    };

    socket.on('pinBoardUpdated', handlePinBoardUpdate);
    return () => socket.off('pinBoardUpdated', handlePinBoardUpdate);
  }, [socket, activeConvId]);

  const updateStatus = async (status) => {
    setPinBoard(prev => ({ ...prev, status }));
    try {
      await fetch(`${backendUrl}/api/conversations/${activeConvId}/pinboard`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const activeConv = teamConvs.find(c => c._id === activeConvId);

  if (teamConvs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <Pin className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-600">No Teams Found</h2>
        <p className="text-slate-500">Create a group chat to start using Team Pin Boards.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full bg-white overflow-hidden">
      
      {/* Left Column: Real-Time Chat Engine */}
      <div className="flex-1 border-r border-slate-100 flex flex-col bg-white">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{activeConv?.name || 'Project Team'}</h2>
          <p className="text-sm text-slate-500 font-medium">{activeConv?.participants.length} Members</p>
        </div>
        <div className="flex-1 overflow-hidden relative flex flex-col items-center justify-center bg-slate-50/50">
           <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
           <p className="text-slate-500 font-medium">Chat messaging is managed in the Unified Chat view.</p>
           <button 
             onClick={() => navigate(`/chat/${activeConv._id}`)} 
             className="mt-4 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
           >
             Open Full Chat
           </button>
        </div>
      </div>

      {/* Right Column: Persistent Pin Board */}
      <div className="w-80 bg-white flex flex-col overflow-y-auto custom-scrollbar relative">
        <div className="p-6 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Pin className="w-5 h-5 text-indigo-500" /> Pin Board
          </h3>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Project Status */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Current Status</h4>
            <div className={`p-4 border rounded-xl ${pinBoard.status === 'Blocked' ? 'bg-red-50 border-red-100' : pinBoard.status === 'At Risk' ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
              <select 
                value={pinBoard.status}
                onChange={(e) => updateStatus(e.target.value)}
                className={`text-xs font-bold rounded uppercase tracking-wider mb-2 px-2 py-1 outline-none appearance-none cursor-pointer ${
                  pinBoard.status === 'Blocked' ? 'bg-red-100 text-red-700' : pinBoard.status === 'At Risk' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Blocked">Blocked</option>
              </select>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">Status updated live via MongoDB.</p>
            </div>
          </div>

          {/* Important Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Resources</h4>
            <div className="space-y-2">
              {pinBoard.links?.length === 0 && <p className="text-sm text-slate-400 italic">No links pinned.</p>}
              {pinBoard.links?.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all group">
                  <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-semibold text-slate-700 truncate">{link.title}</div>
                    <div className="text-[11px] text-slate-400 font-medium truncate">{link.url}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Deadlines */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming Deadlines</h4>
            {pinBoard.deadlines?.length === 0 && <p className="text-sm text-slate-400 italic">No deadlines set.</p>}
            {pinBoard.deadlines?.map((deadline, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl mb-2">
                <Clock className="w-5 h-5 text-red-500" />
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-slate-800 truncate">{deadline.task}</div>
                  <div className="text-xs text-red-600 font-semibold">{deadline.date}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}
