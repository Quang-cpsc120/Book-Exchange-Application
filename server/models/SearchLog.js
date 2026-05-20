const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema(
  {
    user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    query:        { type: String, default: '' },
    subject:      { type: String, default: '' },
    condition:    { type: String, default: '' },
    sort:         { type: String, default: 'newest' },
    resultsCount: { type: Number, default: 0 },
    page:         { type: String, enum: ['browse', 'home'], default: 'browse' },
  },
  { timestamps: true }
);

searchLogSchema.index({ user: 1, createdAt: -1 });
searchLogSchema.index({ query: 1 });
searchLogSchema.index({ subject: 1 });
searchLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SearchLog', searchLogSchema);
