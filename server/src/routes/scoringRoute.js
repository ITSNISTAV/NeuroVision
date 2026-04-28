const express=require("express");
const router=express.Router();
const {score}=require("../controllers/scoringController");
router.post("/score/:userId", score);
module.exports=router;