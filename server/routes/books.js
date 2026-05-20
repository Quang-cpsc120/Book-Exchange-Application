const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const ActivityLog = require('../models/ActivityLog');
const SearchLog = require('../models/SearchLog');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/books — browse all available books (with search & filter)
router.get('/', protect, async (req, res) => {
  try {
    const { q, subject, condition, sort } = req.query;
    const filter = { available: true, owner: { $ne: req.user._id } };

    if (subject)   filter.subject = subject;
    if (condition) filter.condition = condition;
    if (q) {
      filter.$or = [
        { title:   { $regex: q, $options: 'i' } },
        { author:  { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
      ];
    }

    const sortMap = { newest: { createdAt: -1 }, condition: { condition: 1 } };
    const sortBy = sortMap[sort] || { createdAt: -1 };

    const books = await Book.find(filter)
      .populate('owner', 'fullName studentId department year')
      .sort(sortBy);

    // Log search asynchronously (don't await — never block the response)
    SearchLog.create({
      user: req.user._id,
      query: q || '',
      subject: subject || '',
      condition: condition || '',
      sort: sort || 'newest',
      resultsCount: books.length,
      page: 'browse',
    }).catch(() => {});

    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/books/recommended — personalized feed for home page
router.get('/recommended', protect, async (req, res) => {
  try {
    const user = req.user;
    const base = { available: true, owner: { $ne: user._id } };
    const populate = { path: 'owner', select: 'fullName studentId department' };

    // Tier 1: match user's major/department
    let majorBooks = [];
    if (user.department) {
      majorBooks = await Book.find({ ...base, subject: user.department })
        .populate(populate).sort({ createdAt: -1 }).limit(8);
    }

    const usedIds = majorBooks.map(b => b._id.toString());

    // Tier 2: match user's listed classes (search title + description)
    let classBooks = [];
    if (user.classes && user.classes.length > 0) {
      const classOr = user.classes.flatMap(cls => [
        { title:       { $regex: cls, $options: 'i' } },
        { description: { $regex: cls, $options: 'i' } },
        { author:      { $regex: cls, $options: 'i' } },
      ]);
      classBooks = await Book.find({
        ...base,
        _id: { $nin: usedIds },
        $or: classOr,
      }).populate(populate).sort({ createdAt: -1 }).limit(8);
    }

    usedIds.push(...classBooks.map(b => b._id.toString()));

    // Tier 3: new arrivals (everything else, most recent)
    const newArrivals = await Book.find({
      ...base,
      _id: { $nin: usedIds },
    }).populate(populate).sort({ createdAt: -1 }).limit(12);

    res.json({ majorBooks, classBooks, newArrivals });
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
    const book = await Book.findById(req.params.id)
      .populate('owner', 'fullName studentId department year');
    if (!book) return res.status(404).json({ message: 'Book not found' });

    await Book.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

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

    await User.findByIdAndUpdate(req.user._id, { $inc: { booksPosted: 1 } });

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
