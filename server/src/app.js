const express=require("express");
const path = require("path");
const scoreRoute=require("./routes/scoringRoute");
const profileRoutes = require("./routes/profile.routes");
const authRoutes  = require("./routes/authRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const cors = require('cors');

const app=express();
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});
app.use("/api", scoreRoute);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skill-gap", skillGapRoutes);
// app.get('/api/health', (req, res) => {
//   res.json({ ok: true })
// })

module.exports = app;

