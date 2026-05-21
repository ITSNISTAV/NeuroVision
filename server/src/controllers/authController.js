const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { sendWelcomeEmail, sendResetEmail } = require('../config/mailer');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to remove sensitive fields from user object
function safeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.resetToken;
  delete obj.resetTokenExpiry;
  return obj;
}

// POST /api/auth/register
async function postRegister(req, res) {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role || 'user',
      profilePic: req.body.profilePic || '',
    });

    // Send welcome email (don't await, let it run in background)
    sendWelcomeEmail(user.email, user.name).catch(err => console.error('Email failed:', err));

    res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/auth/login
async function postLogin(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ user: safeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/auth/google
async function postGoogleAuth(req, res) {
  try {
    const { credential } = req.body || {};
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email: email.trim().toLowerCase() });
    let isNewUser = false;

    if (user) {
      // Existing user: link Google ID if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.profilePic) user.profilePic = picture;
        await user.save();
      }
    } else {
      // New user via Google
      isNewUser = true;
      user = await User.create({
        name,
        email: email.trim().toLowerCase(),
        password: '', // No password for Google-authenticated users
        googleId,
        profilePic: picture || '',
        role: 'user',
      });
    }

    // Send welcome email only for brand new Google users
    if (isNewUser) {
      sendWelcomeEmail(user.email, user.name).catch(err => console.error('Email failed:', err));
    }

    res.json({ user: safeUser(user) });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
}

// POST /api/auth/upload-avatar
async function uploadAvatar(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Assume frontend serves static files from /public and so we can access via /uploads/...
    const imageUrl = `/uploads/${req.file.filename}`;
    user.profilePic = imageUrl;
    await user.save();

    res.json({ user: safeUser(user) });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 3600000);
    await user.save();
    const resetLink = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    sendResetEmail(user.email, resetLink).catch(err => console.error('Reset email failed:', err));
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link.' });
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { postRegister, postLogin, postGoogleAuth, uploadAvatar, forgotPassword, resetPassword };