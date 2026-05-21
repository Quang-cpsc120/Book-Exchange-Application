const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ── MongoDB ──────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅  MongoDB connected successfully');
    console.log(`📦  Database: ${mongoose.connection.name}`);
    await ensureIndexes();
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));

async function ensureIndexes() {
  try {
    const db = mongoose.connection.db;

    // Books — fast browse/search/filter
    await db.collection('books').createIndex({ subject: 1, available: 1 });
    await db.collection('books').createIndex({ available: 1, createdAt: -1 });
    await db.collection('books').createIndex({ owner: 1, createdAt: -1 });
    await db.collection('books').createIndex({ title: 'text', author: 'text', subject: 'text' });
    await db.collection('books').createIndex({ views: -1 });

    // Users — fast lookup + admin queries
    await db.collection('users').createIndex({ email: 1 },     { unique: true, sparse: true });
    await db.collection('users').createIndex({ studentId: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ department: 1 });
    await db.collection('users').createIndex({ isAdmin: 1 });

    // Activity logs — fast per-user feed + admin aggregation
    await db.collection('activitylogs').createIndex({ user: 1, createdAt: -1 });
    await db.collection('activitylogs').createIndex({ action: 1, createdAt: -1 });
    await db.collection('activitylogs').createIndex({ createdAt: -1 });

    // Search logs — analytics queries
    await db.collection('searchlogs').createIndex({ user: 1, createdAt: -1 });
    await db.collection('searchlogs').createIndex({ query: 1 });
    await db.collection('searchlogs').createIndex({ subject: 1 });
    await db.collection('searchlogs').createIndex({ createdAt: -1 });
    await db.collection('searchlogs').createIndex({ resultsCount: 1 });

    // Exchange requests — fast status checks
    await db.collection('exchangerequests').createIndex({ bookOwner: 1, status: 1 });
    await db.collection('exchangerequests').createIndex({ requester: 1, createdAt: -1 });
    await db.collection('exchangerequests').createIndex({ book: 1, status: 1 });
    await db.collection('exchangerequests').createIndex({ status: 1, createdAt: -1 });

    // Messages + Conversations
    await db.collection('conversations').createIndex({ participants: 1 });
    await db.collection('conversations').createIndex({ lastAt: -1 });
    await db.collection('messages').createIndex({ conversation: 1, createdAt: 1 });

    console.log('📇  Database indexes ensured');
  } catch (err) {
    console.warn('⚠️  Index creation warning:', err.message);
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/books',     require('./routes/books'));
app.use('/api/requests',  require('./routes/requests'));
app.use('/api/activity',  require('./routes/activity'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/messages',  require('./routes/messages'));
app.use('/api/watchlist', require('./routes/watchlist'));

// ── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName: mongoose.connection.name,
    timestamp: new Date().toISOString(),
  });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  BookSwap server running on http://localhost:${PORT}`);
  console.log(`🔍  Health check: http://localhost:${PORT}/api/health`);
});
