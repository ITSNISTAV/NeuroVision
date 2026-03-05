const express = require("express");
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require("./src/routes/authRoutes");
const skillGapRoutes = require("./src/routes/skillGapRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// API Routes
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/skill-gap', skillGapRoutes);

// Serve skillGap.html for the root path
app.get('/skillGap', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'skillGap.html'));
});

// Serve skillGap.html for direct access
app.get('/skillGap.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'skillGap.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📄 Access skillGap at http://localhost:${PORT}/skillGap.html`);
});  
