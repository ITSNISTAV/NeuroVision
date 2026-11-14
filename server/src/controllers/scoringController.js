const Profile = require("../models/Profile");
const Role = require("../models/roleData.schema");

const { analyzeProjectQuality } = require("./services/projectQualityService");
const { generateRealityGap } = require("./services/realityGapService");
const { generateImprovementPriorities } = require("./services/improvementPriorityService");
const { generateRoadmap } = require("./services/roadmapService");

const normalizeSkill = (skill = "") => {
  return skill
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .trim();
};

const getScoreLevel = (score) => {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Intermediate";
  if (score >= 30) return "Basic";
  return "Weak";
};

const score = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        message: "userId and role are required"
      });
    }

    // USER PROFILE
    const userProfile = await Profile.findOne({ userId });

    if (!userProfile) {
      return res.status(404).json({
        message: "User profile not found"
      });
    }

    // USER ROLE
    const userRole = userProfile.roles.find(
      (r) => r.role.toLowerCase().trim() === role.toLowerCase().trim()
    );

    if (!userRole) {
      return res.status(404).json({
        message: "Role not found in user profile"
      });
    }

    // ROLE DEFINITION
    const roleDefinition = await Role.findOne({
      role: { $regex: `^${role}$`, $options: "i" }
    });

    if (!roleDefinition) {
      return res.status(404).json({
        message: "Role definition not found"
      });
    }

    // STACK
    if (!userRole.selectedStack) {
      return res.status(400).json({
        message: "User has not selected a stack for this role"
      });
    }

    const selectedStack = roleDefinition.stacks.find(
      (stack) =>
        stack.stackName.toLowerCase().trim() ===
        userRole.selectedStack.toLowerCase().trim()
    );

    if (!selectedStack) {
      console.error(`Stack not found. Available stacks:`, roleDefinition.stacks?.map(s => s.stackName));
      return res.status(404).json({
        message: `Stack "${userRole.selectedStack}" not found in role definition`
      });
    }

    const requiredSkills = selectedStack.skills;

    let earnedScore = 0;
    let totalWeight = 0;

    const matchedSkills = [];
    const missingSkills = [];
    const skillBreakdown = [];

    // SCORE CALCULATION
    requiredSkills.forEach((roleSkill) => {
      const skillWeight = Number(roleSkill.weight) || 0;
      const requiredLevel = Number(roleSkill.requiredLevel) || 1;

      totalWeight += skillWeight;

      const userSkill = userRole.technicalSkills.find(
        (skill) =>
          normalizeSkill(skill.skill) ===
          normalizeSkill(roleSkill.name)
      );

      if (userSkill) {
        const userLevel = Number(userSkill.level) || 0;

        const ratio = Math.min(userLevel / requiredLevel, 1);

        const skillEarnedScore = ratio * skillWeight;

        earnedScore += skillEarnedScore;

        matchedSkills.push(roleSkill.name);

        skillBreakdown.push({
          skill: roleSkill.name,

          status:
            ratio >= 1
              ? "matched"
              : "needs_improvement",

          userLevel,
          requiredLevel,

          weight: skillWeight,

          earned:
            Math.round(skillEarnedScore * 10) / 10,

          max: skillWeight,

          practiceTask: roleSkill.practiceTask || "",

          dependencyChain:
            roleSkill.dependencyChain || [],

          miniProjects:
            roleSkill.miniProjects || []
        });
      } else {
        missingSkills.push(roleSkill.name);

        skillBreakdown.push({
          skill: roleSkill.name,

          status: "missing",

          userLevel: 0,

          requiredLevel,

          weight: skillWeight,

          earned: 0,

          max: skillWeight,

          practiceTask: roleSkill.practiceTask || "",

          dependencyChain:
            roleSkill.dependencyChain || [],

          miniProjects:
            roleSkill.miniProjects || []
        });
      }
    });

    const finalScore =
      totalWeight > 0
        ? (earnedScore / totalWeight) * 100
        : 0;

    const roundedScore =
      Math.round(finalScore * 10) / 10;

    const level = getScoreLevel(roundedScore);

    // SERVICES
    const projectQuality = analyzeProjectQuality(
      userRole.projects || [],
      roleDefinition.role,
      selectedStack
    );

    const realityGap = generateRealityGap(
      userRole,
      skillBreakdown,
      projectQuality
    );

    const improvementPriorities =
      generateImprovementPriorities(
        roleDefinition.role,
        skillBreakdown,
        projectQuality,
        realityGap
      );

    const roadmap = generateRoadmap(
      roleDefinition.role,
      skillBreakdown,
      projectQuality,
      realityGap,
      improvementPriorities
    );

    return res.status(200).json({
      message: "success",

      role: roleDefinition.role,

      selectedStack:
        selectedStack.stackName,

      finalScore: roundedScore,

      level,

      scoreSummary: {
        earnedScore:
          Math.round(earnedScore * 10) / 10,

        totalWeight,

        matchedSkillsCount:
          matchedSkills.length,

        missingSkillsCount:
          missingSkills.length,

        totalRequiredSkills:
          requiredSkills.length
      },

      matchedSkills,

      missingSkills,

      skillBreakdown,

      projectQuality,

      realityGap,

      improvementPriorities,

      roadmap
    });

  } catch (error) {
    console.error("Error in score controller:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = { score };