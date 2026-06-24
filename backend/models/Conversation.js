const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  name: { type: String }, // Optional name for groups
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Conversation', conversationSchema);
