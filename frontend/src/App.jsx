import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, NavLink, useParams, Link, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Search, Bell, MoreHorizontal, MessageSquare, Users, Calendar, FileText, Phone, Settings, LogOut } from 'lucide-react';
import JoinScreen from './components/JoinScreen';
import ChatRoom from './components/ChatRoom';
import RoomSelection from './components/RoomSelection';
import IncomingCallModal from './components/IncomingCallModal';
import ActiveCall from './components/ActiveCall';
import ActivityView from './components/views/ActivityView';
import TeamsView from './components/views/TeamsView';
import CalendarView from './components/views/CalendarView';
import CallsView from './components/views/CallsView';
import FilesView from './components/views/FilesView';
import SettingsView from './components/views/SettingsView';
import { useWebRTC } from './hooks/useWebRTC';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

function MainLayout({ user, token, socket, isConnected }) {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();
  const rtc = useWebRTC(socket, user);

  const fetchConversations = () => {
    if (!token) return;
    fetch(`${backendUrl}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setConversations(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchConversations();
  }, [token]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  function NavItem({ icon, label, to }) {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
  
    return (
      <Link 
        to={to} 
        className={`relative group flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
          isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full"></div>
        )}
        {icon}
        <span className="text-[10px] mt-1.5 font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F4F5F7]">
      <div className="flex w-full h-full max-w-[1600px] overflow-hidden bg-white rounded-3xl mnc-shadow border border-slate-200/60">
        
        {/* Sidebar Navigation */}
        <div className="w-[72px] bg-white border-r border-slate-100 flex flex-col items-center py-6 gap-6 z-10">
          
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            C
          </div>

          <div className="flex flex-col gap-3 mt-4 w-full px-3">
            <NavItem icon={<Bell className="w-6 h-6" />} label="Activity" to="/activity" />
            <NavItem icon={<MessageSquare className="w-6 h-6" />} label="Chat" to="/chat" />
            <NavItem icon={<Users className="w-6 h-6" />} label="Teams" to="/teams" />
            <NavItem icon={<Calendar className="w-6 h-6" />} label="Calendar" to="/calendar" />
            <NavItem icon={<Phone className="w-6 h-6" />} label="Calls" to="/calls" />
            <NavItem icon={<FileText className="w-6 h-6" />} label="Files" to="/files" />
          </div>

          <div className="mt-auto flex flex-col gap-4 items-center">
            <Link to="/settings" className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all">
              <Settings className="w-6 h-6" />
            </Link>
            <button className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all" onClick={handleLogout} title="Logout">
              <LogOut className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm mt-2">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-600 font-medium">{user?.displayName?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white flex flex-col min-w-0 relative">
          
          <IncomingCallModal 
            incomingCall={rtc.incomingCall} 
            onAccept={rtc.answerCall} 
            onReject={rtc.rejectCall} 
          />
          
          <ActiveCall 
            callState={rtc.callState}
            localStream={rtc.localStream}
            remoteStream={rtc.remoteStream}
            localVideoRef={rtc.localVideoRef}
            remoteVideoRef={rtc.remoteVideoRef}
            isAudioMuted={rtc.isAudioMuted}
            isVideoMuted={rtc.isVideoMuted}
            onToggleAudio={rtc.toggleAudio}
            onToggleVideo={rtc.toggleVideo}
            onChangeAudioInput={rtc.changeAudioInput}
            onEndCall={rtc.endCall}
          />

          <Routes>
            <Route path="/chat" element={<UnifiedChatView socket={socket} user={user} isConnected={isConnected} conversations={conversations} token={token} onStartCall={rtc.startCall} onConversationCreated={fetchConversations} />} />
            <Route path="/chat/:conversationId" element={<UnifiedChatView socket={socket} user={user} isConnected={isConnected} conversations={conversations} token={token} onStartCall={rtc.startCall} onConversationCreated={fetchConversations} />} />
            <Route path="/teams" element={<TeamsView />} />
            <Route path="/activity" element={<ActivityView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/calls" element={<CallsView />} />
            <Route path="/files" element={<FilesView />} />
            <Route path="/settings" element={<SettingsView user={user} onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function ChatView({ socket, user, isConnected, conversations, onStartCall, conversationId }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const currentConv = conversations?.find(c => c._id === conversationId);
  const roomUsers = currentConv ? currentConv.participants : [];
  const otherParticipant = roomUsers.find(p => p.email !== user.email);
  const title = currentConv?.isGroup ? currentConv.name : (otherParticipant?.displayName || 'Unknown');

  useEffect(() => {
    if (!socket || !conversationId) return;
    
    // Auto-join was done on backend connection, but we fetch history
    socket.emit('getHistory', { conversationId });

    function onHistory(data) {
      if (data.conversationId === conversationId) {
        setMessages(data.messages);
      }
    }

    function onNewMessage(newMessage) {
      if (newMessage.conversationId === conversationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    }

    function onMessageRead({ messageId, readBy }) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, readBy } : msg
      ));
    }

    function onUserTyping({ sender, conversationId: cId }) {
      if (cId === conversationId) {
        setTypingUsers(prev => new Set(prev).add(sender));
      }
    }

    function onUserStopTyping({ sender, conversationId: cId }) {
      if (cId === conversationId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(sender);
          return newSet;
        });
      }
    }

    socket.on('history', onHistory);
    socket.on('newMessage', onNewMessage);
    socket.on('messageRead', onMessageRead);
    socket.on('userTyping', onUserTyping);
    socket.on('userStopTyping', onUserStopTyping);

    return () => {
      socket.off('history', onHistory);
      socket.off('newMessage', onNewMessage);
      socket.off('messageRead', onMessageRead);
      socket.off('userTyping', onUserTyping);
      socket.off('userStopTyping', onUserStopTyping);
    };
  }, [socket, conversationId]);

  const handleSendMessage = (text, mediaUrl = null) => {
    if ((!text.trim() && !mediaUrl) || !socket) return;
    socket.emit('sendMessage', {
      id: crypto.randomUUID(),
      conversationId,
      text: text.trim(),
      mediaUrl,
    });
  };

  const handleTyping = (isTyping) => {
    if (!socket) return;
    if (isTyping) socket.emit('typing', { conversationId });
    else socket.emit('stopTyping', { conversationId });
  };

  const handleMarkAsRead = (messageId) => {
    if (!socket) return;
    socket.emit('markAsRead', { messageId });
  };

  return (
    <ChatRoom
      roomId={conversationId}
      title={title}
      user={user}
      messages={messages}
      typingUsers={Array.from(typingUsers)}
      roomUsers={roomUsers}
      onSendMessage={handleSendMessage}
      onTyping={handleTyping}
      onMarkAsRead={handleMarkAsRead}
      onStartCall={onStartCall}
      isConnected={isConnected}
      onLeave={() => {}} // Disabled for persistent chats
    />
  );
}

function UnifiedChatView({ socket, user, isConnected, token, conversations, onStartCall, onConversationCreated }) {
  const { conversationId } = useParams();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      const res = await fetch(`${backendUrl}/api/users/search?email=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartChat = async (targetUserId) => {
    try {
      const res = await fetch(`${backendUrl}/api/conversations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ targetUserId })
      });
      const data = await res.json();
      if (onConversationCreated) onConversationCreated();
      setSearch(''); // Clear search to go back to list
      navigate(`/chat/${data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full w-full bg-white rounded-[24px]">
      {/* Sidebar List (WhatsApp Style) */}
      <div className="w-80 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 z-10">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Chats</h2>
          </div>
          
          <div className="relative group flex gap-2">
            <input 
              type="text" 
              placeholder="Search directory..." 
              className="w-full bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl border border-transparent focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm font-medium placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm">Search</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
          <div className="space-y-1 mt-2">
            {search ? (
              // Show Search Results
              results.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm">No results found in directory</div>
              ) : (
                results.map(u => (
                  <div 
                    key={u._id} 
                    onClick={() => handleStartChat(u._id)}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {u.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700">{u.displayName}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{u.email}</div>
                      </div>
                    </div>
                    <MessageSquare className="w-4 h-4 text-slate-300" />
                  </div>
                ))
              )
            ) : (
              // Show Recent Conversations History
              conversations.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm">No conversations yet. Search to start one!</div>
              ) : (
                conversations.map(conv => {
                  const otherParticipant = conv.participants.find(p => p.email !== user.email);
                  const title = conv.isGroup ? conv.name : otherParticipant?.displayName || 'Unknown';
                  const avatarLetter = title.charAt(0).toUpperCase();
                  const isActive = conv._id === conversationId;

                  return (
                    <div 
                      key={conv._id} 
                      onClick={() => navigate(`/chat/${conv._id}`)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border border-transparent ${
                        isActive ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50 hover:border-slate-100'
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm">
                          {avatarLetter}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-[14px] font-semibold text-slate-800 truncate">{title}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate font-medium">
                          {conv.lastMessage?.text || 'Start chatting...'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Detail Area */}
      <div className="flex-1 bg-slate-50/50 flex flex-col relative rounded-r-[24px] overflow-hidden">
        {conversationId ? (
          <ChatView 
            socket={socket} 
            user={user} 
            isConnected={isConnected} 
            conversations={conversations} 
            onStartCall={onStartCall} 
            conversationId={conversationId} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-500 mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-slate-100">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">CorpChat Web</h3>
            <p className="text-slate-500 max-w-md font-medium">Select a conversation from the sidebar or search the directory to start chatting instantly.</p>
          </div>
        )}
      </div>
    </div>
  );
}


export default function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        setUser({
          id: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email.split('@')[0]
        });
        setToken(idToken);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(backendUrl, { auth: { token } });
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [token]);

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<div className="h-screen flex items-center justify-center bg-gray-50"><JoinScreen /></div>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/*" element={<MainLayout user={user} token={token} socket={socket} isConnected={isConnected} />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}
