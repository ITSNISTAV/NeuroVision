const express=require("express");
const scoreRoute=require("./routes/scoringRoute");
const path = require("path");

const app=express();
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

app.use("/api", scoreRoute);
module.exports=app;