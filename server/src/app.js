const express=require("express");
const path = require("path");
const scoreRoute=require("./routes/scoringRoute");
const profileRoutes = require("./routes/profile.routes");
const authRoutes  = require("./routes/authRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const rolesRoutes = require("./routes/rolesRoutes");
const cors = require('cors');

const app=express();
// app.use(express.static(path.join(__dirname, "../public")));
app.use(cors({ origin: ["http://localhost:5173", "https://aureon-tau.vercel.app"], credentials: true }));
app.use(express.json());
app.use(cors())

app.use("/api", scoreRoute);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skill-gap", skillGapRoutes);
app.use("/api/roles", rolesRoutes);
// app.get('/api/health', (req, res) => {
//   res.json({ ok: true })
// })

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')))
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../../client/dist/index.html')))
}

module.exports = app;

