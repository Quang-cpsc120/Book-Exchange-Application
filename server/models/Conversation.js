const mongoose = require('mongoose');

const convSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    book:         { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
    lastMessage:  { type: String, default: '' },
    lastAt:       { type: Date, default: Date.now },
  },
  { timestamps: true }
);

convSchema.index({ participants: 1 });
convSchema.index({ lastAt: -1 });

module.exports = mongoose.model('Conversation', convSchema);
