const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// GET /api/messages/unread — unread count (must be before /:convId)
router.get('/unread', protect, async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id }).select('_id');
    const convIds = convs.map(c => c._id);
    const count = await Message.countDocuments({
      conversation: { $in: convIds },
      sender:       { $ne: req.user._id },
      readBy:       { $ne: req.user._id },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages/start — find or create a conversation (must be before /:convId)
router.post('/start', protect, async (req, res) => {
  try {
    const { recipientId, bookId } = req.body;
    if (!recipientId) return res.status(400).json({ message: 'recipientId required' });

    const query = { participants: { $all: [req.user._id, recipientId], $size: 2 } };
    if (bookId) query.book = bookId;

    let conv = await Conversation.findOne(query)
      .populate('participants', 'fullName studentId')
      .populate('book', 'title author');

    if (!conv) {
      const created = await Conversation.create({
        participants: [req.user._id, recipientId],
        book: bookId || null,
      });
      conv = await Conversation.findById(created._id)
        .populate('participants', 'fullName studentId')
        .populate('book', 'title author');
    }

    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages — list all conversations for the current user
router.get('/', protect, async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'fullName studentId')
      .populate('book', 'title author')
      .sort({ lastAt: -1 });
    res.json(convs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/:convId — messages in a conversation
router.get('/:convId', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.convId,
      participants: req.user._id,
    })
      .populate('participants', 'fullName studentId')
      .populate('book', 'title author');
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const messages = await Message.find({ conversation: conv._id })
      .populate('sender', 'fullName _id')
      .sort({ createdAt: 1 });

    res.json({ conv, messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages/:convId — send a message
router.post('/:convId', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text required' });

    const msg = await Message.create({
      conversation: conv._id,
      sender:       req.user._id,
      text:         text.trim(),
      readBy:       [req.user._id],
    });

    await Conversation.findByIdAndUpdate(conv._id, {
      lastMessage: text.trim().slice(0, 100),
      lastAt:      new Date(),
    });

    const populated = await msg.populate('sender', 'fullName _id');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/messages/:convId/read — mark all as read
router.patch('/:convId/read', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    await Message.updateMany(
      { conversation: conv._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
