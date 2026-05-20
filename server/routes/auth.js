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
    const { fullName, studentId, email, password, department } = req.body;

    // Check duplicates
    const exists = await User.findOne({ $or: [{ email }, { studentId }] });
    if (exists) {
      const field = exists.email === email ? 'Email' : 'Student ID';
      return res.status(400).json({ message: `${field} already registered` });
    }

    const user = await User.create({ fullName, studentId, email, password, department });

    // Log signup activity
    await ActivityLog.create({
      user: user._id,
      action: 'signup',
      detail: `Welcome to BookSwap, ${fullName}! Your account was created.`,
    });

    console.log(`📝  New student registered: ${fullName} (${studentId})`);

    res.status(201).json({ token: signToken(user._id), user });
  } catch (err) {
    console.error('Register error:', err.message);
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

    // Log login activity
    await ActivityLog.create({
      user: user._id,
      action: 'login',
      detail: `Signed in to BookSwap`,
    });

    console.log(`🔑  Student logged in: ${user.fullName}`);

    res.json({ token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me — get current user
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
