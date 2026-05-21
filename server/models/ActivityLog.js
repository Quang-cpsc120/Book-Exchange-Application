const mongoose = require('mongoose');

// Maps every action to a business category for analytics grouping
const CATEGORY_MAP = {
  signup:            'auth',
  login:             'auth',
  post_book:         'catalog',
  view_book:         'catalog',
  delete_book:       'catalog',
  isbn_lookup:       'catalog',
  request_sent:      'exchange',
  request_accepted:  'exchange',
  request_declined:  'exchange',
  request_completed: 'exchange',
  message_sent:      'messaging',
  watchlist_add:     'discovery',
  watchlist_remove:  'discovery',
  profile_update:    'profile',
};

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
    },
    action: {
      type:     String,
      enum:     Object.keys(CATEGORY_MAP),
      required: true,
    },
    // Auto-set by pre-save hook; indexed for fast category-based analytics
    category: {
      type: String,
      enum: ['auth', 'catalog', 'exchange', 'messaging', 'discovery', 'profile'],
    },
    detail: { type: String, required: true },

    // Flexible bag for action-specific context
    // e.g. { isbn, bookSubject, offerBook, fields, keywords, resultsCount, ... }
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Typed references for JOIN-style queries in the admin dashboard
    relatedBook:         { type: mongoose.Schema.Types.ObjectId, ref: 'Book',            default: null },
    relatedRequest:      { type: mongoose.Schema.Types.ObjectId, ref: 'ExchangeRequest', default: null },
    relatedConversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation',    default: null },
  },
  { timestamps: true }
);

// Auto-populate category from action so callers never have to pass it
activityLogSchema.pre('save', function (next) {
  this.category = CATEGORY_MAP[this.action] || 'other';
  next();
});

// ── Indexes for analytics queries ───────────────────────────────────────────
activityLogSchema.index({ user: 1, createdAt: -1 });         // per-user feed
activityLogSchema.index({ action: 1, createdAt: -1 });        // action funnel
activityLogSchema.index({ category: 1, createdAt: -1 });      // category rollup
activityLogSchema.index({ createdAt: -1 });                   // time-series
activityLogSchema.index({ category: 1, action: 1, createdAt: -1 }); // compound

module.exports = mongoose.model('ActivityLog', activityLogSchema);
