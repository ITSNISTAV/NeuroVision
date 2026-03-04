const express=require("express");
// const app=express();
const router=express.Router();
const {score}=require("../controllers/scoringController");
// this route will be mounted at /api in app.js, so the full URL becomes /api/score
router.post("/score", score);
module.exports=router;