require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const admin = require('firebase-admin');

// Initialize Firebase Admin (Fallback to demo project if credentials missing)
try {
  // If FIREBASE_SERVICE_ACCOUNT is provided as a JSON string in env
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project' });
  }
  console.log('Firebase Admin initialized');
} catch (err) {
  console.error('Firebase Admin init error:', err);
}

const uploadRoutes = require('./routes/upload');
const Message = require('./models/Message');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
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

// Database State Flags
let isMongoConnected = false;
let isRedisConnected = false;

// Fallback in-memory store if MongoDB is not provided
const fallbackMessages = [];

// Redis setup (Optional)
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    isRedisConnected = true;
    console.log('Redis adapter connected');
  }).catch(err => console.error('Redis connection error (skipping Redis):', err.message));
} else {
  console.log('No REDIS_URL provided. Running Socket.io on single node.');
}

// MongoDB connection (Optional)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      isMongoConnected = true;
      console.log('MongoDB connected');
    })
    .catch(err => console.error('MongoDB connection error (using in-memory fallback):', err.message));
} else {
  console.log('No MONGO_URI provided. Using in-memory array for messages.');
}

// Middleware for Firebase Authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = { 
      userId: decodedToken.uid, 
      email: decodedToken.email, 
      displayName: decodedToken.name || decodedToken.email.split('@')[0] 
    };
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    next(new Error('Authentication error: Invalid Firebase token'));
  }
});

const typingTimeouts = new Map();

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.id}, UserID: ${socket.user.userId}`);

  socket.on('joinRoom', async ({ roomId }) => {
    const currentRooms = Array.from(socket.rooms);
    currentRooms.forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });

    socket.join(roomId);

    try {
      let history = [];
      if (isMongoConnected) {
        history = await Message.find({ roomId }).sort({ timestamp: -1 }).limit(100);
        history = history.reverse();
      } else {
        history = fallbackMessages.filter(m => m.roomId === roomId).slice(-100);
      }
      socket.emit('history', history);
    } catch (err) {
      console.error('Error fetching history', err);
    }
  });

  socket.on('sendMessage', async (data) => {
    const { roomId, text, mediaUrl, timestamp, id } = data;
    if (!roomId || !id) return;

    try {
      const msgPayload = {
        id,
        roomId,
        senderId: socket.user.userId,
        senderName: socket.user.displayName,
        text,
        mediaUrl,
        timestamp: timestamp || new Date(),
        readBy: [socket.user.userId],
      };

      if (isMongoConnected) {
        const existingMsg = await Message.findOne({ id });
        if (existingMsg) return; // Idempotency check

        const message = new Message(msgPayload);
        await message.save();
        io.to(roomId).emit('newMessage', message);
      } else {
        // Fallback in-memory logic
        const existing = fallbackMessages.find(m => m.id === id);
        if (!existing) {
          fallbackMessages.push(msgPayload);
          if (fallbackMessages.length > 5000) fallbackMessages.shift();
          io.to(roomId).emit('newMessage', msgPayload);
        }
      }
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('markAsRead', async ({ messageId }) => {
    try {
      if (isMongoConnected) {
        const message = await Message.findOne({ id: messageId });
        if (message && !message.readBy.includes(socket.user.userId)) {
          message.readBy.push(socket.user.userId);
          await message.save();
          io.to(message.roomId).emit('messageRead', { messageId, readBy: message.readBy });
        }
      } else {
        const message = fallbackMessages.find(m => m.id === messageId);
        if (message && !message.readBy.includes(socket.user.userId)) {
          message.readBy.push(socket.user.userId);
          io.to(message.roomId).emit('messageRead', { messageId, readBy: message.readBy });
        }
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  });

  socket.on('typing', ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('userTyping', { sender: socket.user.displayName });

    const timeoutKey = `${roomId}-${socket.user.userId}`;
    if (typingTimeouts.has(timeoutKey)) clearTimeout(typingTimeouts.get(timeoutKey));

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
    for (const [key, timeout] of typingTimeouts.entries()) {
      if (key.endsWith(`-${socket.user.userId}`)) {
        clearTimeout(timeout);
        typingTimeouts.delete(key);
      }
    }
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

if (require.main === module) {
  server.listen(process.env.PORT || 3001, () => {
    console.log(`Server is running on port ${process.env.PORT || 3001}`);
  });
}

module.exports = { app, server, io };
