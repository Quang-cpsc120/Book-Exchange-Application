const express = require('express');
const router = express.Router();
const ExchangeRequest = require('../models/ExchangeRequest');
const Book = require('../models/Book');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

// GET /api/requests — get all requests for current user (incoming + outgoing)
router.get('/', protect, async (req, res) => {
  try {
    const requests = await ExchangeRequest.find({
      $or: [{ requester: req.user._id }, { bookOwner: req.user._id }],
    })
      .populate('requester', 'fullName studentId')
      .populate('bookOwner', 'fullName studentId')
      .populate('book', 'title author subject condition')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/requests — send an exchange request
router.post('/', protect, async (req, res) => {
  try {
    const { bookId, offerBook, message } = req.body;

    const book = await Book.findById(bookId).populate('owner');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (!book.available) return res.status(400).json({ message: 'Book is no longer available' });
    if (book.owner._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot request your own book' });
    }

    // Check for duplicate pending request
    const duplicate = await ExchangeRequest.findOne({
      requester: req.user._id,
      book: bookId,
      status: 'pending',
    });
    if (duplicate) return res.status(400).json({ message: 'You already sent a request for this book' });

    const exchangeRequest = await ExchangeRequest.create({
      requester: req.user._id,
      book: bookId,
      bookOwner: book.owner._id,
      offerBook,
      message,
    });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'request_sent',
      detail: `Sent exchange request for "${book.title}", offering "${offerBook}"`,
      relatedBook: book._id,
      relatedRequest: exchangeRequest._id,
    });

    console.log(`📤  Exchange request: ${req.user.fullName} → "${book.title}"`);

    const populated = await exchangeRequest.populate([
      { path: 'requester', select: 'fullName studentId' },
      { path: 'book', select: 'title author subject' },
      { path: 'bookOwner', select: 'fullName studentId' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/requests/:id — accept or decline
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const exchangeRequest = await ExchangeRequest.findById(req.params.id).populate('book');

    if (!exchangeRequest) return res.status(404).json({ message: 'Request not found' });
    if (exchangeRequest.bookOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    exchangeRequest.status = status;
    await exchangeRequest.save();

    if (status === 'accepted') {
      // Mark book unavailable
      await Book.findByIdAndUpdate(exchangeRequest.book._id, { available: false });

      // Decline all other pending requests for the same book
      await ExchangeRequest.updateMany(
        { book: exchangeRequest.book._id, _id: { $ne: exchangeRequest._id }, status: 'pending' },
        { status: 'declined' }
      );

      // Update exchange count for both parties
      await User.findByIdAndUpdate(req.user._id, { $inc: { exchangesCompleted: 1 } });
      await User.findByIdAndUpdate(exchangeRequest.requester, { $inc: { exchangesCompleted: 1 } });

      await ActivityLog.create({
        user: req.user._id,
        action: 'request_accepted',
        detail: `Accepted exchange for "${exchangeRequest.book.title}"`,
        relatedBook: exchangeRequest.book._id,
        relatedRequest: exchangeRequest._id,
      });

      console.log(`✅  Exchange accepted: "${exchangeRequest.book.title}"`);
    } else if (status === 'declined') {
      await ActivityLog.create({
        user: req.user._id,
        action: 'request_declined',
        detail: `Declined exchange for "${exchangeRequest.book.title}"`,
        relatedBook: exchangeRequest.book._id,
        relatedRequest: exchangeRequest._id,
      });
    }

    res.json(exchangeRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
