const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'signup', 'login',
        'post_book', 'view_book', 'delete_book',
        'request_sent', 'request_accepted', 'request_declined',
      ],
      required: true,
    },
    detail: { type: String, required: true },
    // Optional reference to related book or request
    relatedBook: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ExchangeRequest', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
