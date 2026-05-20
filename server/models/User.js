const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName:  { type: String, required: [true, 'Full name is required'], trim: true },
    studentId: { type: String, required: [true, 'Student ID is required'], unique: true, trim: true },
    email:     { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password:  { type: String, required: [true, 'Password is required'], minlength: 6 },
    department:{ type: String, default: '' },
    year:      { type: String, enum: ['Freshman','Sophomore','Junior','Senior','Graduate',''], default: '' },
    classes:   { type: [String], default: [] },
    bio:       { type: String, default: '' },
    avatarColor: { type: String, default: '' },
    booksPosted:       { type: Number, default: 0 },
    exchangesCompleted:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
