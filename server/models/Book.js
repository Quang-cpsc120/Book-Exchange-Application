const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: { type: String, trim: true, default: 'Unknown' },
    subject: {
      type: String,
      enum: [
        'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
        'Biology', 'Engineering', 'Economics', 'Literature', 'History', 'Other',
      ],
      default: 'Other',
    },
    condition: {
      type: String,
      enum: ['Like New', 'Good', 'Fair', 'Worn'],
      default: 'Good',
    },
    description: { type: String, default: '' },
    available: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text search index for title, author, subject
bookSchema.index({ title: 'text', author: 'text', subject: 'text' });

module.exports = mongoose.model('Book', bookSchema);
