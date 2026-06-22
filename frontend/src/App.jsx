import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import JoinScreen from './components/JoinScreen';
import ChatRoom from './components/ChatRoom';

// Connect to the backend server dynamically.
const backendUrl = import.meta.env.DEV ? 'http://localhost:3001' : undefined;
const socket = io(backendUrl);

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [displayName, setDisplayName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [roomUsers, setRoomUsers] = useState([]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      // Rejoin room if we reconnect
      if (roomId && displayName) {
        const storedUserId = localStorage.getItem('chat_userId');
        socket.emit('joinRoom', { roomId, sender: displayName, userId: storedUserId });
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onHistory(historyMessages) {
      setMessages(historyMessages);
    }

    function onNewMessage(newMessage) {
      setMessages((prev) => [...prev, newMessage]);
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
    socket.on('userTyping', onUserTyping);
    socket.on('userStopTyping', onUserStopTyping);
    socket.on('roomUsers', onRoomUsers);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('history', onHistory);
      socket.off('newMessage', onNewMessage);
      socket.off('userTyping', onUserTyping);
      socket.off('userStopTyping', onUserStopTyping);
      socket.off('roomUsers', onRoomUsers);
    };
  }, [roomId, displayName]);

  const handleJoin = (name, room) => {
    let storedUserId = localStorage.getItem('chat_userId');
    if (!storedUserId) {
      storedUserId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2);
      localStorage.setItem('chat_userId', storedUserId);
    }
    
    setDisplayName(name);
    setRoomId(room);
    socket.emit('joinRoom', { roomId: room, sender: name, userId: storedUserId });
  };

  const handleLeave = () => {
    if (roomId) {
      socket.emit('leaveRoom', { roomId });
    }
    setDisplayName('');
    setRoomId('');
    setMessages([]);
    setTypingUsers(new Set());
    setRoomUsers([]);
  };

  const handleSendMessage = (text) => {
    if (!text.trim() || !roomId) return;
    
    socket.emit('sendMessage', {
      roomId,
      sender: displayName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    });
  };

  const handleTyping = (isTyping) => {
    if (!roomId) return;
    if (isTyping) {
      socket.emit('typing', { roomId, sender: displayName });
    } else {
      socket.emit('stopTyping', { roomId, sender: displayName });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      {!roomId ? (
        <JoinScreen onJoin={handleJoin} isConnected={isConnected} />
      ) : (
        <ChatRoom
          roomId={roomId}
          displayName={displayName}
          messages={messages}
          typingUsers={Array.from(typingUsers)}
          roomUsers={roomUsers}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          isConnected={isConnected}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}

export default App;
