require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const multer = require('multer');

// Models
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

const app = express();
app.use(cors());
app.use(express.json());

// Set headers for Firebase Authentication Popups
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});
const upload = multer({ storage });

// Firebase
let firebaseApp;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    firebaseApp = admin.initializeApp({ projectId: 'realtime-chat-86476' });
  }
} catch (err) {
  console.error('Firebase Admin init error:', err);
}

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.set('trust proxy', true);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/corpchat';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` });
});

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decodedToken = await getAuth(firebaseApp).verifyIdToken(token);
    let user = await User.findOne({ uid: decodedToken.uid });
    if (!user) {
      user = new User({
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        avatarUrl: decodedToken.picture || ''
      });
      await user.save();
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Search Users
app.get('/api/users/search', verifyToken, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json([]);
  const users = await User.find({ email: new RegExp(email, 'i'), _id: { $ne: req.user._id } }).limit(10);
  res.json(users);
});

// Create/Get Conversation
app.post('/api/conversations', verifyToken, async (req, res) => {
  const { targetUserId } = req.body;
  try {
    let conv = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, targetUserId] }
    }).populate('participants');
    
    if (!conv) {
      conv = new Conversation({ participants: [req.user._id, targetUserId] });
      await conv.save();
      conv = await conv.populate('participants');
    }
    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations', verifyToken, async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .populate('participants')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error: Token missing'));

  try {
    const decodedToken = await getAuth(firebaseApp).verifyIdToken(token);
    
    // Sync user to MongoDB
    let user = await User.findOne({ uid: decodedToken.uid });
    if (!user) {
      user = new User({
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        avatarUrl: decodedToken.picture || ''
      });
      await user.save();
    } else {
      user.lastSeen = new Date();
      await user.save();
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid Firebase token'));
  }
});

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.id}, Email: ${socket.user.email}`);

  // Auto-subscribe to all user's conversations
  const conversations = await Conversation.find({ participants: socket.user._id });
  conversations.forEach(conv => {
    socket.join(conv._id.toString());
  });

  socket.on('getHistory', async ({ conversationId }) => {
    try {
      let history = await Message.find({ conversationId })
        .sort({ timestamp: -1 })
        .limit(100)
        .populate('senderId', 'displayName avatarUrl email');
      
      history = history.reverse();
      socket.emit('history', { conversationId, messages: history });
    } catch (err) {
      console.error('Error fetching history', err);
    }
  });

  socket.on('sendMessage', async (data) => {
    const { conversationId, text, mediaUrl, id } = data;
    if (!conversationId || !id) return;

    try {
      const existingMsg = await Message.findOne({ id });
      if (existingMsg) return;

      const message = new Message({
        id,
        conversationId,
        senderId: socket.user._id,
        text,
        mediaUrl,
        readBy: [socket.user._id],
      });
      await message.save();

      // Update conversation lastMessage
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });

      const populatedMsg = await message.populate('senderId', 'displayName avatarUrl email');
      io.to(conversationId).emit('newMessage', populatedMsg);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('markAsRead', async ({ messageId }) => {
    try {
      const message = await Message.findOne({ id: messageId });
      if (message && !message.readBy.includes(socket.user._id)) {
        message.readBy.push(socket.user._id);
        await message.save();
        io.to(message.conversationId.toString()).emit('messageRead', { messageId, readBy: message.readBy });
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  });

  socket.on('typing', ({ conversationId }) => {
    socket.to(conversationId).emit('userTyping', { sender: socket.user.displayName, conversationId });
  });

  socket.on('stopTyping', ({ conversationId }) => {
    socket.to(conversationId).emit('userStopTyping', { sender: socket.user.displayName, conversationId });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
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
