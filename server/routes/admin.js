const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const User          = require('../models/User');
const Book          = require('../models/Book');
const ExchangeRequest = require('../models/ExchangeRequest');
const ActivityLog   = require('../models/ActivityLog');
const SearchLog     = require('../models/SearchLog');
const { protect }   = require('../middleware/auth');
const adminOnly     = require('../middleware/admin');

router.use(protect, adminOnly);

// Lightweight audit helper — logs which admin viewed which dashboard page
function logAdminAccess(req, page) {
  ActivityLog.create({
    user:     req.user._id,
    action:   'admin_access',
    detail:   `Viewed admin ${page}`,
    metadata: { page },
  }).catch(() => {});
}

// ── GET /api/admin/overview ──────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  logAdminAccess(req, 'overview');
  try {
    const [users, books, exchanges, searches, pendingExchanges, completedExchanges] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      ExchangeRequest.countDocuments(),
      SearchLog.countDocuments(),
      ExchangeRequest.countDocuments({ status: 'pending' }),
      ExchangeRequest.countDocuments({ status: 'accepted' }),
    ]);

    // New users in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });
    const newBooksThisWeek = await Book.countDocuments({ createdAt: { $gte: weekAgo } });

    // Daily activity for last 14 days
    const dailyActivity = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totals: { users, books, exchanges, searches, pendingExchanges, completedExchanges },
      trends: { newUsersThisWeek, newBooksThisWeek },
      dailyActivity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  logAdminAccess(req, 'users');
  try {
    const { sort = 'newest', q } = req.query;
    const filter = {};
    if (q) filter.$or = [
      { fullName:  { $regex: q, $options: 'i' } },
      { email:     { $regex: q, $options: 'i' } },
      { studentId: { $regex: q, $options: 'i' } },
      { department:{ $regex: q, $options: 'i' } },
    ];

    const sortMap = { newest: { createdAt: -1 }, books: { booksPosted: -1 }, exchanges: { exchangesCompleted: -1 } };
    const users = await User.find(filter)
      .select('-password')
      .sort(sortMap[sort] || { createdAt: -1 });

    // Attach last-login from activity log
    const lastLogins = await ActivityLog.aggregate([
      { $match: { action: 'login' } },
      { $sort:  { createdAt: -1 } },
      { $group: { _id: '$user', lastLogin: { $first: '$createdAt' } } },
    ]);
    const loginMap = Object.fromEntries(lastLogins.map(l => [l._id.toString(), l.lastLogin]));

    const enriched = users.map(u => ({
      ...u.toJSON(),
      lastLogin: loginMap[u._id.toString()] || null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/users/:id/activity ────────────────────────────────────────
router.get('/users/:id/activity', async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: req.params.id })
      .populate('relatedBook', 'title author subject')
      .sort({ createdAt: -1 })
      .limit(100);
    const searches = await SearchLog.find({ user: req.params.id })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ logs, searches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/searches ──────────────────────────────────────────────────
router.get('/searches', async (req, res) => {
  logAdminAccess(req, 'searches');
  try {
    const { limit = 200 } = req.query;

    const recent = await SearchLog.find()
      .populate('user', 'fullName studentId department')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Top search terms
    const topTerms = await SearchLog.aggregate([
      { $match: { query: { $ne: '' } } },
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 }, avgResults: { $avg: '$resultsCount' } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // Top subjects searched
    const topSubjects = await SearchLog.aggregate([
      { $match: { subject: { $ne: '' } } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Zero-result searches (demand gaps)
    const zeroResults = await SearchLog.aggregate([
      { $match: { resultsCount: 0, query: { $ne: '' } } },
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ recent, topTerms, topSubjects, zeroResults });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/exchanges ─────────────────────────────────────────────────
router.get('/exchanges', async (req, res) => {
  logAdminAccess(req, 'exchanges');
  try {
    const { status, limit = 200 } = req.query;
    const filter = status ? { status } : {};

    const exchanges = await ExchangeRequest.find(filter)
      .populate('requester',  'fullName studentId department')
      .populate('bookOwner',  'fullName studentId department')
      .populate('book',       'title author subject condition')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Exchange stats by department
    const byDept = await ExchangeRequest.aggregate([
      { $match: { status: 'accepted' } },
      { $lookup: { from: 'users', localField: 'requester', foreignField: '_id', as: 'req' } },
      { $unwind: '$req' },
      { $group: { _id: '$req.department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Exchange stats by book subject
    const bySubject = await ExchangeRequest.aggregate([
      { $match: { status: 'accepted' } },
      { $lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'b' } },
      { $unwind: '$b' },
      { $group: { _id: '$b.subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ exchanges, byDept, bySubject });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/reports ───────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  logAdminAccess(req, 'reports');
  try {
    // Books by subject
    const booksBySubject = await Book.aggregate([
      { $group: { _id: '$subject', total: { $sum: 1 }, available: { $sum: { $cond: ['$available', 1, 0] } } } },
      { $sort: { total: -1 } },
    ]);

    // Books by condition
    const booksByCondition = await Book.aggregate([
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Users by department
    const usersByDept = await User.aggregate([
      { $match: { isAdmin: { $ne: true } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Users by year
    const usersByYear = await User.aggregate([
      { $match: { year: { $ne: '' } } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
    ]);

    // Monthly exchange volume (last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const monthlyExchanges = await ExchangeRequest.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        total:    { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        declined: { $sum: { $cond: [{ $eq: ['$status', 'declined'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Most viewed books
    const topBooks = await Book.find()
      .populate('owner', 'fullName department')
      .sort({ views: -1 })
      .limit(10);

    // Most active users
    const topUsers = await ActivityLog.aggregate([
      { $group: { _id: '$user', actions: { $sum: 1 } } },
      { $sort: { actions: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $project: { actions: 1, fullName: '$u.fullName', studentId: '$u.studentId', department: '$u.department' } },
    ]);

    res.json({
      booksBySubject, booksByCondition,
      usersByDept, usersByYear,
      monthlyExchanges, topBooks, topUsers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/admin/make-admin ───────────────────────────────────────────────
router.post('/make-admin', async (req, res) => {
  try {
    const { studentId } = req.body;
    const user = await User.findOneAndUpdate({ studentId }, { isAdmin: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Audit log — privilege escalation must always be recorded
    await ActivityLog.create({
      user:     req.user._id,
      action:   'admin_promotion',
      detail:   `Granted admin privileges to ${user.fullName} (${user.studentId})`,
      metadata: { promotedUserId: user._id.toString(), promotedStudentId: user.studentId },
    });
    console.log(`🛡️  Admin promotion: ${user.fullName} (${user.studentId}) by ${req.user.fullName}`);

    res.json({ message: `${user.fullName} is now an admin`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
