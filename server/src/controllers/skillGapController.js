const fs = require('fs');
const path = require('path');

// Read data from JSON files in server/data folder
const roleRequirementsPath = path.join(__dirname, '../../data/roleRequirements.json');
const tutorialLinksPath = path.join(__dirname, '../../data/tutorialLinks.json');

let roleRequirements = {};
let tutorialLinks = {};

try {
  roleRequirements = JSON.parse(fs.readFileSync(roleRequirementsPath, 'utf8'));
  tutorialLinks = JSON.parse(fs.readFileSync(tutorialLinksPath, 'utf8'));
  console.log('✅ Skill Gap data loaded successfully');
} catch (error) {
  console.error('❌ Error reading JSON files:', error.message);
}

const analyzeSkillGap = (profileData) => {
  const { technicalSkills = [], tools = [], targetRole, cgpa } = profileData;

  const requiredSkills = roleRequirements[targetRole];

  if (!requiredSkills) {
    return { error: "Role not found" };
  }

  const userSkills = [...technicalSkills, ...tools].map(s =>
    s.toLowerCase()
  );

  const matchedSkills = requiredSkills.filter(skill =>
    userSkills.includes(skill.toLowerCase())
  );

  const missingSkills = requiredSkills.filter(skill =>
    !userSkills.includes(skill.toLowerCase())
  );

  // Create missing skills with tutorial links
  const missingSkillsWithTutorials = missingSkills.map(skill => ({
    skill,
    tutorial: tutorialLinks[skill] || `https://www.geeksforgeeks.org/search/?q=${skill}`
  }));

  const compatibilityScore = Math.round(
    (matchedSkills.length / requiredSkills.length) * 100
  );

  // CGPA-based status and recommendations (0-10 scale)
  let cgpaStatus = "";
  let cgpaBonus = "";
  
  if (cgpa >= 9.0) {
    cgpaStatus = "Excellent Academic Performance 🌟";
    cgpaBonus = " You have outstanding academic foundation.";
  } else if (cgpa >= 8.5) {
    cgpaStatus = "Very Good Academic Performance 👑";
    cgpaBonus = " Your academics are excellent.";
  } else if (cgpa >= 8.0) {
    cgpaStatus = "Good Academic Performance 👍";
    cgpaBonus = " You have strong academic record.";
  } else if (cgpa >= 7.0) {
    cgpaStatus = "Average Academic Performance 📚";
    cgpaBonus = " Focus more on practical skills.";
  } else if (cgpa >= 6.0) {
    cgpaStatus = "Below Average Academic Performance 📝";
    cgpaBonus = " Prioritize skill development urgently.";
  } else {
    cgpaStatus = "Low Academic Performance ⚠️";
    cgpaBonus = " Need significant improvement in academics and skills.";
  }

  // Smart recommendation based on CGPA + Skills (0-10 scale)
  let recommendation = "";
  
  if (compatibilityScore >= 80 && cgpa >= 8.0) {
    recommendation = `Excellent! You're ${compatibilityScore}% ready for ${targetRole}. With your ${cgpaStatus}, you have strong potential. Focus on: ${missingSkills.slice(0, 2).join(", ") || "refinement"}`;
  } else if (compatibilityScore >= 60 && cgpa >= 7.5) {
    recommendation = `Good progress! You're ${compatibilityScore}% ready. Learn these skills: ${missingSkills.join(", ") || "advanced topics"}`;
  } else if (compatibilityScore >= 40) {
    recommendation = `You have ${compatibilityScore}% skill alignment.${cgpaBonus} Priority: ${missingSkills.slice(0, 3).join(", ")}`;
  } else {
    recommendation = `You're ${compatibilityScore}% ready.${cgpaBonus} Recommended: Learn ${missingSkills.slice(0, 4).join(", ")}. Consider internships to gain practical experience.`;
  }

  return {
    targetRole,
    cgpa,
    cgpaStatus,
    compatibilityScore,
    matchedSkills,
    missingSkills,
    missingSkillsWithTutorials,
    recommendation
  };
};

// Controller function
exports.analyzeSkillGap = (req, res) => {
  try {
    console.log('📥 Received skill gap analysis request:', req.body);
    
    const { cgpa } = req.body;

    if (!cgpa || cgpa < 0 || cgpa > 10) {
      console.log('❌ Invalid CGPA:', cgpa);
      return res.status(400).json({
        error: "Valid CGPA (0-10) is required"
      });
    }

    const result = analyzeSkillGap(req.body);
    console.log('✅ Analysis result:', result);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error in skill gap analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
