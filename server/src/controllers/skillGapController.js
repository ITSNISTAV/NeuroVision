const fs = require("fs");
const path = require("path");

const Role = require("../models/roleData.schema");
const Profile = require("../models/Profile");

const tutorialLinks = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data/tutorialLinks.json"),
    "utf8"
  )
);

const normalizeSkill = (skill = "") => {
  return String(skill)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .trim();
};

const getCgpaStatus = (cgpa) => {
  if (cgpa >= 9.0) {
    return {
      status: "Excellent Academic Performance 🌟",
      bonus: " You have outstanding academic foundation."
    };
  }

  if (cgpa >= 8.5) {
    return {
      status: "Very Good Academic Performance 👑",
      bonus: " Your academics are excellent."
    };
  }

  if (cgpa >= 8.0) {
    return {
      status: "Good Academic Performance 👍",
      bonus: " You have strong academic record."
    };
  }

  if (cgpa >= 7.0) {
    return {
      status: "Average Academic Performance 📚",
      bonus: " Focus more on practical skills."
    };
  }

  if (cgpa >= 6.0) {
    return {
      status: "Below Average Academic Performance 📝",
      bonus: " Prioritize skill development urgently."
    };
  }

  return {
    status: "Low Academic Performance ⚠️",
    bonus: " Need significant improvement in academics and skills."
  };
};

const getRecommendation = (
  compatibilityScore,
  cgpa,
  cgpaBonus,
  targetRole,
  trainingSkills
) => {
  if (compatibilityScore >= 80 && cgpa >= 8.0) {
    return `Excellent! You're ${compatibilityScore}% ready for ${targetRole}. Focus on: ${
      trainingSkills.slice(0, 2).join(", ") || "refinement"
    }`;
  }

  if (compatibilityScore >= 60 && cgpa >= 7.5) {
    return `Good progress! You're ${compatibilityScore}% ready. Improve: ${
      trainingSkills.join(", ") || "advanced topics"
    }`;
  }

  if (compatibilityScore >= 40) {
    return `You have ${compatibilityScore}% skill alignment.${cgpaBonus} Priority: ${trainingSkills
      .slice(0, 3)
      .join(", ")}`;
  }

  return `You're ${compatibilityScore}% ready.${cgpaBonus} Recommended: Learn ${trainingSkills
    .slice(0, 4)
    .join(", ")}. Consider internships.`;
};

exports.analyzeSkillGap = async (req, res) => {
  try {
    const { userId, targetRole } = req.params;

    if (!userId || !targetRole) {
      return res.status(400).json({
        error: "userId and targetRole are required"
      });
    }

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        error: "User profile not found"
      });
    }

    const userRoleData = profile.roles.find(
      (roleItem) =>
        roleItem.role.toLowerCase().trim() ===
        targetRole.toLowerCase().trim()
    );

    if (!userRoleData) {
      return res.status(404).json({
        error: `Role "${targetRole}" not found in user's profile`
      });
    }

    if (!userRoleData.selectedStack) {
      return res.status(400).json({
        error: `Selected stack is missing for role "${targetRole}". Please update this profile.`
      });
    }

    const roleDefinition = await Role.findOne({
      role: new RegExp(`^${targetRole}$`, "i")
    });

    if (!roleDefinition) {
      return res.status(404).json({
        error: "Target role definition not found"
      });
    }

    const selectedStack = roleDefinition.stacks.find(
      (stack) =>
        stack.stackName.toLowerCase().trim() ===
        userRoleData.selectedStack.toLowerCase().trim()
    );

    if (!selectedStack) {
      return res.status(404).json({
        error: `Stack "${userRoleData.selectedStack}" not found for role "${targetRole}"`
      });
    }

    const requiredSkills = selectedStack.skills || [];
    const technicalSkills = userRoleData.technicalSkills || [];

    if (!requiredSkills.length) {
      return res.status(400).json({
        error: `No skills found for stack "${selectedStack.stackName}"`
      });
    }

    const matchedSkills = [];
    const needsImprovementSkills = [];
    const missingSkills = [];

    let totalWeight = 0;
    let earnedWeight = 0;

    for (const requiredSkill of requiredSkills) {
      const weight = Number(requiredSkill.weight) || 10;
      const requiredLevel = Number(requiredSkill.requiredLevel) || 1;

      totalWeight += weight;

      const userSkill = technicalSkills.find(
        (skillItem) =>
          normalizeSkill(skillItem.skill) === normalizeSkill(requiredSkill.name)
      );

      if (!userSkill) {
        missingSkills.push({
          name: requiredSkill.name,
          currentLevel: 0,
          requiredLevel,
          weight,
          raw: requiredSkill
        });

        continue;
      }

      const userLevel = Number(userSkill.level) || 0;
      const contribution = Math.min(userLevel / requiredLevel, 1);

      earnedWeight += contribution * weight;

      if (userLevel >= requiredLevel) {
        matchedSkills.push({
          name: requiredSkill.name,
          currentLevel: userLevel,
          requiredLevel,
          weight
        });
      } else {
        needsImprovementSkills.push({
          name: requiredSkill.name,
          currentLevel: userLevel,
          requiredLevel,
          weight,
          raw: requiredSkill
        });
      }
    }

    const compatibilityScore =
      totalWeight === 0
        ? 0
        : Math.round((earnedWeight / totalWeight) * 100);

    const { status: cgpaStatus, bonus: cgpaBonus } = getCgpaStatus(
      userRoleData.cgpa
    );

    const trainingSkills = [...needsImprovementSkills, ...missingSkills];

    const missingSkillsWithTutorials = trainingSkills.map((item) => {
      const roleSkill = item.raw;
      const name = item.name;

      const linkData = tutorialLinks[name] || {
        tutorial: `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(
          name
        )}`,
        description: `Learn ${name} with practical examples.`,
        averageCompletionTime: "2-3 days",
        difficulty: "Medium",
        prerequisites: [],
        learningPath: [],
        reviews: []
      };

      return {
        skill: name,
        status: item.currentLevel === 0 ? "missing" : "needs_improvement",
        currentLevel: item.currentLevel,
        requiredLevel: item.requiredLevel,
        weight: item.weight,

        tutorial: linkData.tutorial,
        description: linkData.description,
        averageCompletionTime: linkData.averageCompletionTime,
        difficulty: linkData.difficulty,
        prerequisites: linkData.prerequisites || [],
        learningPath: linkData.learningPath || [],
        reviews: linkData.reviews || [],

        practiceTask:
          roleSkill?.practiceTask || `Build a mini task using ${name}.`,

        dependencyChain:
          roleSkill?.dependencyChain && roleSkill.dependencyChain.length
            ? roleSkill.dependencyChain
            : [name],

        miniProjects:
          roleSkill?.miniProjects && roleSkill.miniProjects.length
            ? roleSkill.miniProjects
            : [`Mini project using ${name}`]
      };
    });

    return res.json({
      targetRole,
      selectedStack: selectedStack.stackName,

      cgpa: userRoleData.cgpa,
      cgpaStatus,

      compatibilityScore,

      matchedSkills: matchedSkills.map(
        (skill) =>
          `${skill.name} (Lvl ${skill.currentLevel}/${skill.requiredLevel})`
      ),

      needsImprovementSkills: needsImprovementSkills.map(
        (skill) =>
          `${skill.name} (Lvl ${skill.currentLevel}/${skill.requiredLevel})`
      ),

      missingSkills: missingSkills.map((skill) => skill.name),

      missingSkillsWithTutorials,

      recommendation: getRecommendation(
        compatibilityScore,
        userRoleData.cgpa,
        cgpaBonus,
        targetRole,
        trainingSkills.map((skill) => skill.name)
      )
    });
  } catch (error) {
    console.error("Skill gap analysis error:", error);

    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};