const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory store for chat messages per room
// Format: { [roomId]: { messages: [], users: {} } }
const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomId, sender, userId }) => {
    // Leave previous rooms if any (except their own socket.id room)
    const currentRooms = Array.from(socket.rooms);
    currentRooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { messages: [], users: {} };
    }

    // Add or update the user in the room's registry using unique userId
    if (sender && userId) {
      rooms[roomId].users[userId] = { name: sender, status: 'online', socketId: socket.id, userId };
    }

    // Send chat history for this specific room to the newly connected user
    socket.emit('history', rooms[roomId].messages);

    // Broadcast updated users list
    io.to(roomId).emit('roomUsers', Object.values(rooms[roomId].users));
  });

  socket.on('sendMessage', (data) => {
    const { roomId, sender, text, timestamp, id } = data;

    if (!roomId || !rooms[roomId]) return;

    const message = {
      id: id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
      sender,
      text,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Store in memory for this room
    rooms[roomId].messages.push(message);

    // Keep history bounded per room (e.g., last 1000 messages)
    if (rooms[roomId].messages.length > 1000) {
      rooms[roomId].messages.shift();
    }

    // Broadcast the message to everyone in the room, including the sender
    io.to(roomId).emit('newMessage', message);
  });

  socket.on('typing', ({ roomId, sender }) => {
    if (!roomId) return;
    socket.to(roomId).emit('userTyping', { sender });
  });

  socket.on('stopTyping', ({ roomId, sender }) => {
    if (!roomId) return;
    socket.to(roomId).emit('userStopTyping', { sender });
  });

  socket.on('leaveRoom', ({ roomId }) => {
    if (roomId && rooms[roomId]) {
      for (const uId in rooms[roomId].users) {
        if (rooms[roomId].users[uId].socketId === socket.id) {
          rooms[roomId].users[uId].status = 'offline';
          io.to(roomId).emit('roomUsers', Object.values(rooms[roomId].users));
          socket.leave(roomId);
          break;
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find the user by socket.id and set them offline
    for (const roomId in rooms) {
      if (rooms[roomId].users) {
        for (const uId in rooms[roomId].users) {
          if (rooms[roomId].users[uId].socketId === socket.id) {
            rooms[roomId].users[uId].status = 'offline';
            io.to(roomId).emit('roomUsers', Object.values(rooms[roomId].users));
          }
        }
      }
    }
  });
});

// Fallback to index.html for React Router (if needed)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

if (require.main === module) {
  server.listen(3001, () => {
    console.log('Server is running on port 3001');
  });
}

module.exports = { app, server, io };
