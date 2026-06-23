import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import JoinScreen from './components/JoinScreen';
import ChatRoom from './components/ChatRoom';
import RoomSelection from './components/RoomSelection';

const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : '';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null); // { token, id, displayName, email }
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [roomUsers, setRoomUsers] = useState([]);

  // Check for existing session
  useEffect(() => {
    const token = localStorage.getItem('chat_token');
    const storedUser = localStorage.getItem('chat_user');
    if (token && storedUser) {
      setUser({ token, ...JSON.parse(storedUser) });
    }
  }, []);

  // Initialize socket when user is available
  useEffect(() => {
    if (!user?.token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(backendUrl, {
      auth: { token: user.token }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.token]);

  useEffect(() => {
    if (!socket) return;

    function onConnect() {
      setIsConnected(true);
      // Rejoin room if we reconnect
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
        // Prevent adding duplicate messages in case of edge cases
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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('history', onHistory);
    socket.on('newMessage', onNewMessage);
    socket.on('messageRead', onMessageRead);
    socket.on('userTyping', onUserTyping);
    socket.on('userStopTyping', onUserStopTyping);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('history', onHistory);
      socket.off('newMessage', onNewMessage);
      socket.off('messageRead', onMessageRead);
      socket.off('userTyping', onUserTyping);
      socket.off('userStopTyping', onUserStopTyping);
    };
  }, [socket, roomId]);

  const handleAuth = (token, userData) => {
    localStorage.setItem('chat_token', token);
    localStorage.setItem('chat_user', JSON.stringify(userData));
    setUser({ token, ...userData });
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
    setUser(null);
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
      id: crypto.randomUUID(), // Client-generated UUID for idempotency
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      {!user ? (
        <JoinScreen onAuth={handleAuth} />
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
  );
}

export default App;
