import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center overflow-hidden">
      
      <div className="relative z-10 w-full flex items-center justify-center px-4">
        {!user ? (
          <JoinScreen />
        ) : !roomId ? (
          <RoomSelection user={user} onJoin={handleJoin} onLogout={handleLogout} isConnected={isConnected} />
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default App;
