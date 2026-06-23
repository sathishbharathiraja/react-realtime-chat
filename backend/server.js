require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const Message = require('./models/Message');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Redis setup for Pub/Sub architecture
const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter connected');
}).catch(err => console.error('Redis connection error:', err));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat_messages')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware for JWT Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, decoded) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = decoded; // { userId, email, displayName }
    next();
  });
});

const typingTimeouts = new Map();

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.id}, UserID: ${socket.user.userId}`);

  socket.on('joinRoom', async ({ roomId }) => {
    // Leave previous rooms if any (except their own socket.id room)
    const currentRooms = Array.from(socket.rooms);
    currentRooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    socket.join(roomId);

    try {
      // Fetch recent messages for this room
      const history = await Message.find({ roomId }).sort({ timestamp: -1 }).limit(100);
      socket.emit('history', history.reverse());
    } catch (err) {
      console.error('Error fetching history', err);
    }
  });

  socket.on('sendMessage', async (data) => {
    const { roomId, text, mediaUrl, timestamp, id } = data;

    if (!roomId || !id) return;

    try {
      // Idempotency check: Does a message with this UUID already exist?
      const existingMsg = await Message.findOne({ id });
      if (existingMsg) {
        return; // Ignore duplicate
      }

      const message = new Message({
        id,
        roomId,
        senderId: socket.user.userId,
        senderName: socket.user.displayName,
        text,
        mediaUrl,
        timestamp: timestamp || new Date(),
        readBy: [socket.user.userId], // Sender implicitly read it
      });

      await message.save();

      // Broadcast to room
      io.to(roomId).emit('newMessage', message);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('markAsRead', async ({ messageId }) => {
    try {
      const message = await Message.findOne({ id: messageId });
      if (message && !message.readBy.includes(socket.user.userId)) {
        message.readBy.push(socket.user.userId);
        await message.save();
        io.to(message.roomId).emit('messageRead', { messageId, readBy: message.readBy });
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  });

  socket.on('typing', ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('userTyping', { sender: socket.user.displayName });

    // Server-side timeout for typing indicators (3 seconds)
    const timeoutKey = `${roomId}-${socket.user.userId}`;
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
    }

    const timeout = setTimeout(() => {
      socket.to(roomId).emit('userStopTyping', { sender: socket.user.displayName });
      typingTimeouts.delete(timeoutKey);
    }, 3000);

    typingTimeouts.set(timeoutKey, timeout);
  });

  socket.on('stopTyping', ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('userStopTyping', { sender: socket.user.displayName });
    
    const timeoutKey = `${roomId}-${socket.user.userId}`;
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
      typingTimeouts.delete(timeoutKey);
    }
  });

  socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Clear any typing timeouts for this user
    for (const [key, timeout] of typingTimeouts.entries()) {
      if (key.endsWith(`-${socket.user.userId}`)) {
        clearTimeout(timeout);
        typingTimeouts.delete(key);
        // We could extract roomId from the key and emit stopTyping, but socket is already disconnected.
      }
    }
  });
});

// Fallback to index.html for React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

if (require.main === module) {
  server.listen(3001, () => {
    console.log('Server is running on port 3001');
  });
}

module.exports = { app, server, io };
