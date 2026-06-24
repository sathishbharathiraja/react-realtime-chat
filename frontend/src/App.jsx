import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, NavLink, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Search, Bell, MoreHorizontal, MessageSquare, Users, Calendar, FileText, Phone, Settings } from 'lucide-react';
import JoinScreen from './components/JoinScreen';
import ChatRoom from './components/ChatRoom';
import RoomSelection from './components/RoomSelection';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

function MainLayout({ user, token, socket, isConnected }) {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

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

  const navLinkClass = ({ isActive }) => 
    `flex flex-col items-center gap-1 cursor-pointer group relative ${isActive ? 'text-[#464eb8]' : 'text-gray-500 hover:text-[#464eb8]'}`;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white font-sans text-gray-900">
      {/* Top Navbar */}
      <div className="h-12 w-full bg-[#464eb8] flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2 w-64">
          CorpChat Teams
        </div>
        
        <div className="flex-1 max-w-2xl flex items-center">
          <div className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-md h-8 flex items-center px-3 text-white/90">
            <Search className="w-4 h-4 mr-2 opacity-70" />
            <input type="text" placeholder="Search messages, people, or files" className="bg-transparent border-none outline-none text-sm w-full placeholder-white/70" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 w-64">
          <MoreHorizontal className="w-5 h-5 text-white/90 cursor-pointer" />
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white border border-white/30 cursor-pointer">
            {user.displayName?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-[#f5f5f5]">
        {/* Primary App Bar */}
        <div className="w-[68px] bg-[#ebebeb] flex flex-col items-center py-4 gap-6 shrink-0 border-r border-gray-200">
          <NavLink to="/activity" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute -left-[20px] top-1 bottom-1 w-1 bg-[#464eb8] rounded-r-md"></div>}
                <Bell className={`w-6 h-6 transition-transform ${isActive ? 'fill-[#464eb8]' : 'group-hover:scale-110'}`} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Activity</span>
              </>
            )}
          </NavLink>
          <NavLink to="/chat" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute -left-[20px] top-1 bottom-1 w-1 bg-[#464eb8] rounded-r-md"></div>}
                <MessageSquare className={`w-6 h-6 transition-transform ${isActive ? 'fill-[#464eb8]' : 'group-hover:scale-110'}`} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Chat</span>
              </>
            )}
          </NavLink>
          <NavLink to="/teams" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute -left-[20px] top-1 bottom-1 w-1 bg-[#464eb8] rounded-r-md"></div>}
                <Users className={`w-6 h-6 transition-transform ${isActive ? 'fill-[#464eb8]' : 'group-hover:scale-110'}`} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Teams</span>
              </>
            )}
          </NavLink>
          <NavLink to="/calendar" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute -left-[20px] top-1 bottom-1 w-1 bg-[#464eb8] rounded-r-md"></div>}
                <Calendar className={`w-6 h-6 transition-transform ${isActive ? 'fill-[#464eb8]' : 'group-hover:scale-110'}`} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Calendar</span>
              </>
            )}
          </NavLink>
          <NavLink to="/calls" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute -left-[20px] top-1 bottom-1 w-1 bg-[#464eb8] rounded-r-md"></div>}
                <Phone className={`w-6 h-6 transition-transform ${isActive ? 'fill-[#464eb8]' : 'group-hover:scale-110'}`} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Calls</span>
              </>
            )}
          </NavLink>
          <NavLink to="/files" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute -left-[20px] top-1 bottom-1 w-1 bg-[#464eb8] rounded-r-md"></div>}
                <FileText className={`w-6 h-6 transition-transform ${isActive ? 'fill-[#464eb8]' : 'group-hover:scale-110'}`} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Files</span>
              </>
            )}
          </NavLink>
          <div className="flex-1"></div>
          <NavLink to="/settings" className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute -left-[20px] top-1 bottom-1 w-1 bg-[#464eb8] rounded-r-md"></div>}
                <Settings className={`w-6 h-6 transition-transform ${isActive ? 'text-[#464eb8]' : 'group-hover:scale-110'}`} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>Settings</span>
              </>
            )}
          </NavLink>
        </div>

        {/* Secondary Sidebar (Chat List) */}
        <div className="w-[320px] bg-white flex flex-col shrink-0 border-r border-gray-200 z-10">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Chats</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</span>
            </div>
            
            {conversations.length === 0 ? (
              <div className="text-xs text-gray-400 p-2">No conversations yet. Go to Teams to start one.</div>
            ) : (
              conversations.map(conv => {
                const otherParticipant = conv.participants.find(p => p.email !== user.email);
                const title = conv.isGroup ? conv.name : otherParticipant?.displayName || 'Unknown';
                const avatarLetter = title.charAt(0).toUpperCase();

                return (
                  <NavLink key={conv._id} to={`/chat/${conv._id}`} className={({ isActive }) => `flex items-center gap-3 p-2 rounded-lg cursor-pointer mt-1 ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {avatarLetter}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">{title}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.lastMessage ? 'New message' : 'Start chatting...'}
                      </p>
                    </div>
                  </NavLink>
                );
              })
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#f5f5f5] flex flex-col min-w-0">
          <Routes>
            <Route path="/chat" element={<div className="flex-1 flex items-center justify-center text-gray-500">Select a chat to start messaging</div>} />
            <Route path="/chat/:conversationId" element={<ChatView socket={socket} user={user} isConnected={isConnected} conversations={conversations} />} />
            <Route path="/teams" element={<TeamsView user={user} token={token} onConversationCreated={fetchConversations} />} />
            <Route path="/activity" element={<PlaceholderView icon={<Bell className="w-16 h-16" />} title="Activity" />} />
            <Route path="/calendar" element={<PlaceholderView icon={<Calendar className="w-16 h-16" />} title="Calendar" />} />
            <Route path="/calls" element={<PlaceholderView icon={<Phone className="w-16 h-16" />} title="Calls" />} />
            <Route path="/files" element={<PlaceholderView icon={<FileText className="w-16 h-16" />} title="Files" />} />
            <Route path="/settings" element={<SettingsView user={user} onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function ChatView({ socket, user, isConnected, conversations }) {
  const { conversationId } = useParams();
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
      isConnected={isConnected}
      onLeave={() => {}} // Disabled for persistent chats
    />
  );
}

function TeamsView({ user, token, onConversationCreated }) {
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
      navigate(`/chat/${data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-white overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Start a New Chat</h2>
      <div className="flex gap-2 max-w-md mb-6">
        <input 
          type="text" 
          placeholder="Search users by email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded"
        />
        <button onClick={handleSearch} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Search</button>
      </div>
      <div className="max-w-md">
        {results.map(r => (
          <div key={r._id} className="flex items-center justify-between p-4 border border-gray-200 rounded mb-2">
            <div>
              <p className="font-bold">{r.displayName}</p>
              <p className="text-sm text-gray-500">{r.email}</p>
            </div>
            <button onClick={() => handleStartChat(r._id)} className="px-3 py-1 bg-gray-100 text-indigo-600 font-medium rounded hover:bg-gray-200">Message</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ user, onLogout }) {
  return (
    <div className="flex-1 flex flex-col p-8 bg-white">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Settings</h2>
      <div className="max-w-md p-6 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
            {user.displayName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold">{user.displayName}</h3>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full py-2 bg-red-50 text-red-600 font-semibold rounded border border-red-200 hover:bg-red-100">Sign Out</button>
      </div>
    </div>
  );
}

function PlaceholderView({ icon, title }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
      <div className="text-gray-400 mb-4">{icon}</div>
      <h2 className="text-xl font-bold text-gray-700">{title}</h2>
      <p className="text-sm text-gray-500 mt-2">This module is part of the premium package.</p>
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
