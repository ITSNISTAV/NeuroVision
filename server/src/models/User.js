const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,   // not required for Google users
  },
  role: {
    type: String,
    default: 'user',
  },
  profilePic: {
    type: String,
    default: '',
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
}, {
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;