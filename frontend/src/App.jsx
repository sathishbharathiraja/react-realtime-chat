import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Search, Bell, MoreHorizontal, MessageSquare, Users, Calendar, FileText, Phone } from 'lucide-react';
import JoinScreen from './components/JoinScreen';
import ChatRoom from './components/ChatRoom';
import RoomSelection from './components/RoomSelection';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null); // { id, displayName, email }
  const [token, setToken] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [roomUsers, setRoomUsers] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Listen to Firebase Auth state
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

  // Initialize socket when Firebase token is available
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(backendUrl, {
      auth: { token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    function onConnect() {
      setIsConnected(true);
      if (roomId) {
        socket.emit('joinRoom', { roomId });
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onHistory(historyMessages) {
      setMessages(historyMessages);
    }

    function onNewMessage(newMessage) {
      setMessages((prev) => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    }

    function onMessageRead({ messageId, readBy }) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, readBy } : msg
      ));
    }

    function onUserTyping({ sender }) {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(sender);
        return newSet;
      });
    }

    function onUserStopTyping({ sender }) {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sender);
        return newSet;
      });
    }

    function onRoomUsers(users) {
      setRoomUsers(users);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('history', onHistory);
    socket.on('newMessage', onNewMessage);
    socket.on('messageRead', onMessageRead);
    socket.on('userTyping', onUserTyping);
    socket.on('userStopTyping', onUserStopTyping);
    socket.on('roomUsers', onRoomUsers);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('history', onHistory);
      socket.off('newMessage', onNewMessage);
      socket.off('messageRead', onMessageRead);
      socket.off('userTyping', onUserTyping);
      socket.off('userStopTyping', onUserStopTyping);
      socket.off('roomUsers', onRoomUsers);
    };
  }, [socket, roomId]);

  const handleLogout = async () => {
    await signOut(auth);
    setRoomId('');
  };

  const handleJoin = (room) => {
    setRoomId(room);
    socket?.emit('joinRoom', { roomId: room });
  };

  const handleLeave = () => {
    if (roomId) {
      socket?.emit('leaveRoom', { roomId });
    }
    setRoomId('');
    setMessages([]);
    setTypingUsers(new Set());
    setRoomUsers([]);
  };

  const handleSendMessage = (text, mediaUrl = null) => {
    if ((!text.trim() && !mediaUrl) || !roomId || !socket) return;
    
    socket.emit('sendMessage', {
      id: crypto.randomUUID(),
      roomId,
      text: text.trim(),
      mediaUrl,
      timestamp: new Date().toISOString(),
    });
  };

  const handleTyping = (isTyping) => {
    if (!roomId || !socket) return;
    if (isTyping) {
      socket.emit('typing', { roomId });
    } else {
      socket.emit('stopTyping', { roomId });
    }
  };

  const handleMarkAsRead = (messageId) => {
    if (!socket || !roomId) return;
    socket.emit('markAsRead', { messageId });
  };

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-white flex flex-col font-sans text-gray-900">
      {!user ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <JoinScreen />
        </div>
      ) : !roomId ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <RoomSelection user={user} onJoin={handleJoin} onLogout={handleLogout} isConnected={isConnected} />
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          {/* Top Navbar (Teams Purple) */}
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
              <div className="flex flex-col items-center gap-1 cursor-pointer group text-gray-500 hover:text-[#464eb8]">
                <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium">Activity</span>
              </div>
              <div className="flex flex-col items-center gap-1 cursor-pointer text-[#464eb8] relative">
                <div className="absolute -left-[20px] top-1 bottom-1 w-1 bg-[#464eb8] rounded-r-md"></div>
                <MessageSquare className="w-6 h-6 fill-[#464eb8]" />
                <span className="text-[10px] font-bold">Chat</span>
              </div>
              <div className="flex flex-col items-center gap-1 cursor-pointer group text-gray-500 hover:text-[#464eb8]">
                <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium">Teams</span>
              </div>
              <div className="flex flex-col items-center gap-1 cursor-pointer group text-gray-500 hover:text-[#464eb8]">
                <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium">Calendar</span>
              </div>
              <div className="flex flex-col items-center gap-1 cursor-pointer group text-gray-500 hover:text-[#464eb8]">
                <Phone className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium">Calls</span>
              </div>
              <div className="flex flex-col items-center gap-1 cursor-pointer group text-gray-500 hover:text-[#464eb8]">
                <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium">Files</span>
              </div>
            </div>

            {/* Secondary Sidebar (Chat List) */}
            <div className="w-[320px] bg-white flex flex-col shrink-0 border-r border-gray-200 z-10">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</span>
                  </div>
                  
                  {/* Active Chat Item */}
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-100 cursor-pointer">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {roomId.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">Room: {roomId}</span>
                        <span className="text-[11px] text-gray-500">Now</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {messages.length > 0 ? messages[messages.length - 1].text || 'Attachment' : 'Start chatting...'}
                      </p>
                    </div>
                  </div>

                  {/* Placeholder Inactive Chat */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer mt-1 opacity-60">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">D</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">Design Sync</span>
                        <span className="text-[11px] text-gray-400">Yesterday</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">Let's review the new mockups.</p>
                    </div>
                  </div>
                  
                  {/* Placeholder Inactive Chat */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer mt-1 opacity-60">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">E</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">Engineering Team</span>
                        <span className="text-[11px] text-gray-400">Tuesday</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">Deployment successful!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 bg-[#f5f5f5] flex flex-col min-w-0">
              <ChatRoom
                roomId={roomId}
                user={user}
                messages={messages}
                typingUsers={Array.from(typingUsers)}
                roomUsers={roomUsers}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onMarkAsRead={handleMarkAsRead}
                isConnected={isConnected}
                onLeave={handleLeave}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
