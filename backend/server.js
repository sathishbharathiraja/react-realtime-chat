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
const Activity = require('./models/Activity');

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

app.put('/api/conversations/:id/pinboard', verifyToken, async (req, res) => {
  try {
    const { status, links, deadlines } = req.body;
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    
    if (status) conv.pinBoard.status = status;
    if (links) conv.pinBoard.links = links;
    if (deadlines) conv.pinBoard.deadlines = deadlines;
    
    await conv.save();
    
    // Broadcast the update to the socket room
    io.to(conv._id.toString()).emit('pinBoardUpdated', { conversationId: conv._id, pinBoard: conv.pinBoard });
    
    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pinboard' });
  }
});

// Settings
app.get('/api/users/settings', verifyToken, async (req, res) => {
  res.json({
    quietHours: req.user.quietHours,
    muteAll: req.user.muteAll,
    alias: req.user.alias
  });
});

app.put('/api/users/settings', verifyToken, async (req, res) => {
  try {
    const { quietHours, muteAll, alias } = req.body;
    if (quietHours !== undefined) req.user.quietHours = quietHours;
    if (muteAll !== undefined) req.user.muteAll = muteAll;
    if (alias !== undefined) req.user.alias = alias;
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Files (Attachments)
app.get('/api/files', verifyToken, async (req, res) => {
  try {
    // Find messages with a mediaUrl where the user is a participant of the conversation
    // To do this simply, we find conversations the user is in first:
    const convs = await Conversation.find({ participants: req.user._id }, '_id');
    const convIds = convs.map(c => c._id);

    const files = await Message.find({ 
      conversationId: { $in: convIds }, 
      mediaUrl: { $ne: null } 
    })
    .populate('senderId', 'displayName email uid alias')
    .populate('conversationId', 'isGroup name participants')
    .sort({ timestamp: -1 });

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Activity (Action Inbox)
app.get('/api/activity', verifyToken, async (req, res) => {
  try {
    const activities = await Activity.find({ recipientId: req.user._id, resolved: false })
      .populate('senderId', 'displayName avatarUrl uid alias')
      .populate('conversationId', 'name')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.post('/api/activity', verifyToken, async (req, res) => {
  try {
    const { recipientId, type, text, conversationId } = req.body;
    const activity = new Activity({
      recipientId,
      senderId: req.user._id,
      type,
      text,
      conversationId
    });
    await activity.save();
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.delete('/api/activity/:id', verifyToken, async (req, res) => {
  try {
    const activity = await Activity.findOne({ _id: req.params.id, recipientId: req.user._id });
    if (!activity) return res.status(404).json({ error: 'Not found' });
    activity.resolved = true;
    await activity.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve activity' });
  }
});

// Calendar (Simulated Integration due to OAuth constraints)
app.get('/api/calendar', verifyToken, (req, res) => {
  // In a real app, this would use googleapis with req.user's OAuth token
  res.json([
    { id: 1, title: 'Weekly Sync', time: '10:00 AM - 11:00 AM', link: 'https://meet.google.com/abc', platform: 'meet', attendees: ['Sathish', 'Sarah'] },
    { id: 2, title: 'Client Pitch', time: '1:00 PM - 2:00 PM', link: 'https://zoom.us/j/123', platform: 'zoom', attendees: ['Sathish', 'David'] },
    { id: 3, title: '1:1 with Manager', time: '4:00 PM - 4:30 PM', link: 'https://meet.google.com/xyz', platform: 'meet', attendees: ['Sathish', 'Manager'] }
  ]);
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// Track active huddle participants in memory
const huddles = {}; // { roomId: [userObj] }

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
        .populate('senderId', 'displayName avatarUrl email uid alias');
      
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

      const populatedMsg = await message.populate('senderId', 'displayName avatarUrl email uid alias');
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

  // --- Huddles ---
  socket.on('getHuddles', () => {
    socket.emit('huddlesList', huddles);
  });

  socket.on('joinHuddle', ({ conversationId }) => {
    if (!huddles[conversationId]) huddles[conversationId] = [];
    const alreadyIn = huddles[conversationId].find(u => u._id.toString() === socket.user._id.toString());
    if (!alreadyIn) {
      huddles[conversationId].push({
        _id: socket.user._id,
        displayName: socket.user.displayName,
        avatarUrl: socket.user.avatarUrl
      });
      io.emit('huddlesList', huddles); // Broadcast to all for global dashboard updates
    }
    socket.join(`huddle_${conversationId}`);
  });

  socket.on('leaveHuddle', ({ conversationId }) => {
    if (huddles[conversationId]) {
      huddles[conversationId] = huddles[conversationId].filter(u => u._id.toString() !== socket.user._id.toString());
      if (huddles[conversationId].length === 0) delete huddles[conversationId];
      io.emit('huddlesList', huddles);
    }
    socket.leave(`huddle_${conversationId}`);
  });

  // --- WebRTC Signaling ---
  socket.on('callUser', ({ userToCall, signalData, from, name, conversationId }) => {
    // We can emit directly to the conversation room. All participants in the room will receive it.
    socket.to(conversationId).emit('incomingCall', { 
      signal: signalData, 
      from, 
      name, 
      conversationId 
    });
  });

  socket.on('answerCall', ({ signal, conversationId }) => {
    socket.to(conversationId).emit('callAccepted', { signal });
  });

  socket.on('rejectCall', ({ conversationId }) => {
    socket.to(conversationId).emit('callRejected');
  });

  socket.on('iceCandidate', ({ candidate, conversationId }) => {
    socket.to(conversationId).emit('iceCandidate', { candidate });
  });

  socket.on('endCall', ({ conversationId }) => {
    socket.to(conversationId).emit('callEnded');
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
