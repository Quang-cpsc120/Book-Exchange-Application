const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, studentId, email, password, department, year, classes } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { studentId }] });
    if (exists) {
      const field = exists.email === email ? 'Email' : 'Student ID';
      return res.status(400).json({ message: `${field} already registered` });
    }

    const user = await User.create({
      fullName, studentId, email, password,
      department: department || '',
      year: year || '',
      classes: classes || [],
    });

    await ActivityLog.create({
      user: user._id,
      action: 'signup',
      detail: `Welcome to BookSwap, ${fullName}! Your account was created.`,
    });

    console.log(`📝  New student registered: ${fullName} (${studentId})`);
    res.status(201).json({ token: signToken(user._id), user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await ActivityLog.create({
      user: user._id,
      action: 'login',
      detail: 'Signed in to BookSwap',
    });

    console.log(`🔑  Student logged in: ${user.fullName}`);
    res.json({ token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// PATCH /api/auth/profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const allowed = ['fullName', 'department', 'year', 'classes', 'bio'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    console.log(`✏️   Profile updated: ${user.fullName}`);
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
