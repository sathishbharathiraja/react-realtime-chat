const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Client-generated UUID
  roomId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String },
  mediaUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
  readBy: [{ type: String }], // Array of User IDs who have read this
});

// Index to quickly query messages by room and sort by timestamp
messageSchema.index({ roomId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
