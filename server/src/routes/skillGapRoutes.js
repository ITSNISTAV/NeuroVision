const express = require('express');
const router = express.Router();
const skillGapController = require('../controllers/skillGapController');

// POST /api/skill-gap - Analyze skill gap for a user
router.post('/', skillGapController.analyzeSkillGap);

module.exports = router;
