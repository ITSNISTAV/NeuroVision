const express = require('express');
const router = express.Router();
const skillGapController = require('../controllers/skillGapController');

// GET /api/skill-gap/:id?role=<role> - Analyze skill gap from saved profile by user id
router.get('/:id', skillGapController.analyzeSkillGap);

module.exports = router;
