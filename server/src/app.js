const express     = require("express");
const profileRoutes = require("./routes/profile.routes");
const authRoutes  = require("./routes/auth.routes");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth",    authRoutes);
app.use("/api/profile", profileRoutes);

module.exports = app;

