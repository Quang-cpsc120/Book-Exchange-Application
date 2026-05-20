const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ── Middleware ──
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ── MongoDB Connection ──
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected successfully');
    console.log(`📦  Database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    console.error('    Check your MONGO_URI in server/.env');
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

// ── Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/books',    require('./routes/books'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/activity', require('./routes/activity'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName: mongoose.connection.name,
    timestamp: new Date().toISOString(),
  });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  BookSwap server running on http://localhost:${PORT}`);
  console.log(`🔍  Health check: http://localhost:${PORT}/api/health`);
});
