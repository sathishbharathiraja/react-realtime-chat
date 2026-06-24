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
const Task = require('./models/Task');

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
  const searchQuery = req.query.query || req.query.email;
  if (!searchQuery) return res.json([]);
  
  const regex = new RegExp(searchQuery, 'i');
  const users = await User.find({ 
    _id: { $ne: req.user._id },
    $or: [
      { email: regex },
      { displayName: regex },
      { alias: regex }
    ]
  }).limit(10);
  res.json(users);
});

// All Users for global assignment
app.get('/api/users/all', verifyToken, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } });
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

// Create Group Conversation
app.post('/api/conversations/group', verifyToken, async (req, res) => {
  const { name } = req.body;
  try {
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    const conv = new Conversation({
      isGroup: true,
      name: name.trim(),
      participants: [req.user._id],
      pinBoard: { status: 'On Track', links: [], deadlines: [] }
    });
    await conv.save();
    const populatedConv = await conv.populate('participants');
    
    // Broadcast creation so UI updates
    io.to(req.user._id.toString()).emit('conversationUpdated', populatedConv);
    
    res.json(populatedConv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group conversation' });
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

app.post('/api/conversations/:id/participants', verifyToken, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ error: 'Conversation not found or you are not a member' });
    if (!conv.isGroup) return res.status(400).json({ error: 'Can only add participants to group conversations' });
    
    if (!conv.participants.includes(targetUserId)) {
      conv.participants.push(targetUserId);
      await conv.save();
    }
    
    const populatedConv = await Conversation.findById(conv._id).populate('participants');
    
    // Broadcast the update to the socket room
    io.to(conv._id.toString()).emit('conversationUpdated', populatedConv);
    
    res.json(populatedConv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add participant' });
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

// Tasks API
app.post('/api/tasks', verifyToken, async (req, res) => {
  try {
    const { title, description, assignedTo, conversationId, dueDate } = req.body;
    
    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({ error: 'Title, assignedTo, and dueDate are required' });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      conversationId,
      dueDate: new Date(dueDate)
    });

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Failed to create task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedTo: req.user._id },
      { status },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found or not assigned to you' });
    res.json(task);
  } catch (err) {
    console.error('Failed to update task status:', err);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Calendar (Simulated Integration + MongoDB Tasks)
app.get('/api/calendar', verifyToken, async (req, res) => {
  try {
    // 1. Fetch tasks assigned to the user that are NOT completed
    const tasks = await Task.find({ 
      assignedTo: req.user._id,
      status: 'pending'
    }).populate('assignedBy', 'displayName email');

    // Map tasks to the calendar event format
    const taskEvents = tasks.map(task => {
      const timeStr = new Date(task.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return {
        id: task._id.toString(),
        type: 'task',
        title: task.title,
        description: task.description,
        time: `Due at ${timeStr}`,
        assigner: task.assignedBy?.displayName || 'Someone',
        dueDate: task.dueDate
      };
    });

    // 2. Simulated Google Calendar meetings
    const mockMeetings = [
      { id: 1, type: 'meeting', title: 'Weekly Sync', time: '10:00 AM - 11:00 AM', link: 'https://meet.google.com/abc', platform: 'meet', attendees: ['Sathish', 'Sarah'] },
      { id: 2, type: 'meeting', title: 'Client Pitch', time: '1:00 PM - 2:00 PM', link: 'https://zoom.us/j/123', platform: 'zoom', attendees: ['Sathish', 'David'] },
      { id: 3, type: 'meeting', title: '1:1 with Manager', time: '4:00 PM - 4:30 PM', link: 'https://meet.google.com/xyz', platform: 'meet', attendees: ['Sathish', 'Manager'] }
    ];

    res.json([...mockMeetings, ...taskEvents]);
  } catch (err) {
    console.error('Failed to fetch calendar data:', err);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
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

  socket.on('joinConversation', ({ conversationId }) => {
    if (conversationId) {
      socket.join(conversationId.toString());
    }
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
    
    const newUser = {
      _id: socket.user._id,
      socketId: socket.id,
      displayName: socket.user.displayName,
      avatarUrl: socket.user.avatarUrl
    };

    huddles[conversationId].push(newUser);
    io.emit('huddlesList', huddles); // Broadcast to all for global dashboard updates
    
    socket.join(`huddle_${conversationId}`);

    // Tell the new user who is already in the huddle so they can initiate P2P calls
    const existingPeers = huddles[conversationId].filter(u => u.socketId !== socket.id);
    socket.emit('huddlePeers', existingPeers);
  });

  socket.on('leaveHuddle', ({ conversationId }) => {
    if (huddles[conversationId]) {
      huddles[conversationId] = huddles[conversationId].filter(u => u.socketId !== socket.id);
      if (huddles[conversationId].length === 0) delete huddles[conversationId];
      io.emit('huddlesList', huddles);
    }
    socket.leave(`huddle_${conversationId}`);
    
    // Notify others in the huddle that this socket left so they can clean up the peer connection
    socket.to(`huddle_${conversationId}`).emit('userLeftHuddle', { socketId: socket.id });
  });

  // --- WebRTC Signaling (Targeted Mesh Routing) ---
  socket.on('ringGroup', ({ conversationId, callerName }) => {
    socket.to(conversationId).emit('groupRinging', { conversationId, callerName });
  });

  socket.on('callUser', ({ userToCall, signalData, from, name, conversationId }) => {
    // userToCall is the target's socket.id. Send specifically to them.
    io.to(userToCall).emit('incomingCall', { 
      signal: signalData, 
      from, // from is caller's socket.id
      name, 
      conversationId,
      userId: socket.user._id
    });
  });

  socket.on('answerCall', ({ to, signal, conversationId }) => {
    // to is the caller's socket.id
    io.to(to).emit('callAccepted', { signal, from: socket.id });
  });

  socket.on('iceCandidate', ({ to, candidate, conversationId }) => {
    io.to(to).emit('iceCandidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Clean up any huddles this user was in
    for (const conversationId in huddles) {
      const wasInHuddle = huddles[conversationId].some(u => u.socketId === socket.id);
      if (wasInHuddle) {
        huddles[conversationId] = huddles[conversationId].filter(u => u.socketId !== socket.id);
        if (huddles[conversationId].length === 0) delete huddles[conversationId];
        io.emit('huddlesList', huddles);
        socket.to(`huddle_${conversationId}`).emit('userLeftHuddle', { socketId: socket.id });
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
