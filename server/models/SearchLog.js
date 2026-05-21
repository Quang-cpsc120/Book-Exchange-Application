const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema(
  {
    user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    query:        { type: String, default: '' },   // free-text search
    subject:      { type: String, default: '' },   // major / subject filter
    classCode:    { type: String, default: '' },   // course code filter (CPSC 120, etc.)
    condition:    { type: String, default: '' },   // book condition filter
    sort:         { type: String, default: 'newest' },
    resultsCount: { type: Number, default: 0 },
    page:         { type: String, enum: ['browse', 'home'], default: 'browse' },
  },
  { timestamps: true }
);

// ── Indexes for search analytics ────────────────────────────────────────────
searchLogSchema.index({ user: 1, createdAt: -1 });
searchLogSchema.index({ query: 1 });
searchLogSchema.index({ subject: 1 });
searchLogSchema.index({ classCode: 1 });
searchLogSchema.index({ createdAt: -1 });
searchLogSchema.index({ resultsCount: 1 });
searchLogSchema.index({ subject: 1, classCode: 1 }); // combo filter analytics

module.exports = mongoose.model('SearchLog', searchLogSchema);
