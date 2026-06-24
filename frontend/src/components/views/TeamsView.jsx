import React, { useState, useEffect } from 'react';
import { Pin, Link as LinkIcon, Clock, MessageSquare, Users, UserPlus, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function TeamsView({ conversations, socket, token, onConversationUpdated }) {
  const [activeConvId, setActiveConvId] = useState(null);
  const [pinBoard, setPinBoard] = useState({ status: 'On Track', links: [], deadlines: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const teamConvs = conversations.filter(c => c.isGroup);

  useEffect(() => {
    if (teamConvs.length > 0 && !activeConvId) {
      setActiveConvId(teamConvs[0]._id);
      setPinBoard(teamConvs[0].pinBoard || { status: 'On Track', links: [], deadlines: [] });
    }
  }, [teamConvs, activeConvId]);

  useEffect(() => {
    if (!socket) return;
    
    const handlePinBoardUpdate = (data) => {
      if (data.conversationId === activeConvId) setPinBoard(data.pinBoard);
    };

    const handleConversationUpdated = (data) => {
      if (data._id === activeConvId && onConversationUpdated) {
        onConversationUpdated(); // Trigger refresh in App.jsx
      }
    };

    socket.on('pinBoardUpdated', handlePinBoardUpdate);
    socket.on('conversationUpdated', handleConversationUpdated);
    
    return () => {
      socket.off('pinBoardUpdated', handlePinBoardUpdate);
      socket.off('conversationUpdated', handleConversationUpdated);
    };
  }, [socket, activeConvId, onConversationUpdated]);

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

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`${backendUrl}/api/users/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (targetUserId) => {
    try {
      const res = await fetch(`${backendUrl}/api/conversations/${activeConvId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeConv = teamConvs.find(c => c._id === activeConvId);

  const [newTeamName, setNewTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateTeam = async (e) => {
    e?.preventDefault();
    if (!newTeamName.trim()) return;
    
    setIsCreating(true);
    try {
      const res = await fetch(`${backendUrl}/api/conversations/group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newTeamName })
      });
      const data = await res.json();
      if (res.ok) {
        setNewTeamName('');
        setShowCreateForm(false);
        setActiveConvId(data._id);
        if (onConversationUpdated) onConversationUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  if (teamConvs.length === 0 && !showCreateForm) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-500 mb-6 shadow-sm border border-slate-100">
          <Users className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">No Teams Found</h2>
        <p className="text-slate-500 font-medium mb-8">Create a group chat to start collaborating with your team.</p>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" /> Create a New Team
        </button>
      </div>
    );
  }

  if (showCreateForm || (teamConvs.length === 0 && showCreateForm)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Create New Team</h2>
          <p className="text-sm text-slate-500 font-medium mb-6">Give your project or team a memorable name.</p>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Project Apollo"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              {teamConvs.length > 0 && (
                <button 
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit"
                disabled={!newTeamName.trim() || isCreating}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!activeConv) return null;

  return (
    <div className="flex-1 flex h-full bg-white overflow-hidden">
      
      {/* Left Column: Team Members & Chat Engine */}
      <div className="flex-1 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              {activeConv?.name || 'Project Team'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">{activeConv?.participants.length} Members</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2 border border-slate-200"
            >
              <UserPlus className="w-4 h-4" /> New Team
            </button>
            <button 
               onClick={() => navigate(`/chat/${activeConv._id}`)} 
               className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
             >
               <MessageSquare className="w-4 h-4" /> Open Chat
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            
            {/* Add Member Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-indigo-500" /> Add Team Member
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium placeholder-slate-400"
                  placeholder="Search by name, email, or alias..."
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                  </div>
                )}
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                  {searchResults.map(user => {
                    const isAlreadyMember = activeConv.participants.some(p => p._id === user._id);
                    return (
                      <div key={user._id} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
                            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" /> : (user.alias || user.displayName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{user.alias || user.displayName}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                        {isAlreadyMember ? (
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Joined</span>
                        ) : (
                          <button 
                            onClick={() => handleAddMember(user._id)}
                            className="text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-1.5 rounded-full transition-colors"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Member Directory */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-indigo-500" /> Team Directory ({activeConv.participants.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeConv.participants.map(p => (
                  <div key={p._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-white flex shrink-0 items-center justify-center text-indigo-600 font-bold shadow-sm border border-slate-100">
                      {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full rounded-full object-cover" /> : (p.alias || p.displayName || p.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-[15px] truncate">{p.alias || p.displayName}</div>
                      <div className="text-xs text-slate-500 font-medium truncate">{p.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right Column: Persistent Pin Board */}
      <div className="w-80 bg-white flex flex-col overflow-y-auto custom-scrollbar relative border-l border-slate-100 shrink-0">
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
