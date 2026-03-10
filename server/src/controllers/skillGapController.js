const fs = require('fs');
const path = require('path');
const { readData } = require('../utils/role.util');

const tutorialLinks = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/tutorialLinks.json'), 'utf8')
);

const getCgpaStatus = (cgpa) => {
  if (cgpa >= 9.0) return { status: "Excellent Academic Performance 🌟", bonus: " You have outstanding academic foundation." };
  if (cgpa >= 8.5) return { status: "Very Good Academic Performance 👑",  bonus: " Your academics are excellent." };
  if (cgpa >= 8.0) return { status: "Good Academic Performance 👍",        bonus: " You have strong academic record." };
  if (cgpa >= 7.0) return { status: "Average Academic Performance 📚",     bonus: " Focus more on practical skills." };
  if (cgpa >= 6.0) return { status: "Below Average Academic Performance 📝", bonus: " Prioritize skill development urgently." };
  return           { status: "Low Academic Performance ⚠️",                bonus: " Need significant improvement in academics and skills." };
};

const getRecommendation = (compatibilityScore, cgpa, cgpaBonus, targetRole, missingSkills) => {
  if (compatibilityScore >= 80 && cgpa >= 8.0)
    return `Excellent! You're ${compatibilityScore}% ready for ${targetRole}. Focus on: ${missingSkills.slice(0, 2).join(", ") || "refinement"}`;
  if (compatibilityScore >= 60 && cgpa >= 7.5)
    return `Good progress! You're ${compatibilityScore}% ready. Learn: ${missingSkills.join(", ") || "advanced topics"}`;
  if (compatibilityScore >= 40)
    return `You have ${compatibilityScore}% skill alignment.${cgpaBonus} Priority: ${missingSkills.slice(0, 3).join(", ")}`;
  return `You're ${compatibilityScore}% ready.${cgpaBonus} Recommended: Learn ${missingSkills.slice(0, 4).join(", ")}. Consider internships.`;
};

exports.analyzeSkillGap = async (req, res) => {
  try {
    const { targetRole, cgpa, technicalSkills = [], tools = [] } = req.body;

    if (!targetRole || !cgpa || cgpa < 0 || cgpa > 10) {
      return res.status(400).json({ error: "targetRole and valid CGPA (0-10) are required" });
    }

    const roleData = await readData();
    const matchedRole = roleData.roles.find(r => r.role === targetRole);
    if (!matchedRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    const userSkills = [...technicalSkills, ...tools].map(s => s.toLowerCase());
    const requiredSkills = matchedRole.skills;

    const matchedSkills = requiredSkills.filter(s => userSkills.includes(s.name.toLowerCase()));
    const missingSkills = requiredSkills.filter(s => !userSkills.includes(s.name.toLowerCase()));

    const compatibilityScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);

    const { status: cgpaStatus, bonus: cgpaBonus } = getCgpaStatus(cgpa);
    const missingNames = missingSkills.map(s => s.name);

    return res.status(200).json({
      targetRole,
      cgpa,
      cgpaStatus,
      compatibilityScore,
      matchedSkills: matchedSkills.map(s => s.name),
      missingSkills: missingNames,
      missingSkillsWithTutorials: missingNames.map(name => ({
        skill: name,
        tutorial: tutorialLinks[name] || `https://www.geeksforgeeks.org/search/?q=${name}`
      })),
      recommendation: getRecommendation(compatibilityScore, cgpa, cgpaBonus, targetRole, missingNames)
    });

  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};