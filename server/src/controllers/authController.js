const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function postRegister(req, res) {
  try {
    const { name, email, password, role, profilePic } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role || 'user',
      profilePic: profilePic || ''
    });

    if (user) {
      const token = generateToken(user);
      res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePic: user.profilePic
        },
        token
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function postLogin(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied, token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

module.exports = { postRegister, postLogin, authenticateToken };
