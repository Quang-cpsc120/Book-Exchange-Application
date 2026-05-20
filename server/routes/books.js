const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/books — browse all available books (with search & filter)
router.get('/', protect, async (req, res) => {
  try {
    const { q, subject, condition } = req.query;
    const filter = { available: true, owner: { $ne: req.user._id } };

    if (subject) filter.subject = subject;
    if (condition) filter.condition = condition;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
      ];
    }

    const books = await Book.find(filter)
      .populate('owner', 'fullName studentId department')
      .sort({ createdAt: -1 });

    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/books/mine — get current user's books
router.get('/mine', protect, async (req, res) => {
  try {
    const books = await Book.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/books/:id — get single book and log view
router.get('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      'owner', 'fullName studentId department'
    );
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Increment view count
    await Book.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Log view activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'view_book',
      detail: `Viewed "${book.title}" by ${book.author}`,
      relatedBook: book._id,
    });

    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/books — post a new book
router.post('/', protect, async (req, res) => {
  try {
    const { title, author, subject, condition, description } = req.body;

    const book = await Book.create({
      owner: req.user._id,
      title, author, subject, condition, description,
    });

    // Update user's book count
    await User.findByIdAndUpdate(req.user._id, { $inc: { booksPosted: 1 } });

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'post_book',
      detail: `Posted "${title}" for exchange`,
      relatedBook: book._id,
    });

    console.log(`📚  New book posted: "${title}" by ${req.user.fullName}`);

    const populated = await book.populate('owner', 'fullName studentId');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/books/:id — update availability
router.patch('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, owner: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found or not yours' });

    Object.assign(book, req.body);
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/books/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found or not yours' });

    await ActivityLog.create({
      user: req.user._id,
      action: 'delete_book',
      detail: `Removed "${book.title}" from listings`,
    });

    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
