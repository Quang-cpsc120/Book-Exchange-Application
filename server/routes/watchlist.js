const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

// GET /api/watchlist
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('watchlist');
    res.json(user.watchlist || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/watchlist
router.post('/', protect, async (req, res) => {
  try {
    const { keywords, subject } = req.body;
    if (!keywords && !subject) return res.status(400).json({ message: 'keywords or subject required' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { watchlist: { keywords: keywords || '', subject: subject || '', createdAt: new Date() } } },
      { new: true }
    ).select('watchlist');

    ActivityLog.create({
      user:     req.user._id,
      action:   'watchlist_add',
      detail:   `Saved search: ${[keywords, subject].filter(Boolean).join(' / ') || 'all books'}`,
      metadata: { keywords: keywords || '', subject: subject || '' },
    }).catch(() => {});

    res.json(user.watchlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/watchlist/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { watchlist: { _id: req.params.id } } },
      { new: true }
    ).select('watchlist');

    ActivityLog.create({
      user:     req.user._id,
      action:   'watchlist_remove',
      detail:   `Removed a saved search`,
      metadata: { watchlistItemId: req.params.id },
    }).catch(() => {});

    res.json(user.watchlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
