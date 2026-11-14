const generateImprovementPriorities = (
  role,
  skillBreakdown = [],
  projectQuality = {},
  realityGap = []
) => {

  const priorities = [];

  const missingSkills = skillBreakdown.filter(
    skill => skill.status === "missing"
  );

  const weakSkills = skillBreakdown.filter(
    skill => skill.status === "needs_improvement"
  );

  // 1. Project Evidence
  if (projectQuality.overallScore < 50) {
    priorities.push({
      title: "Build Stronger Role-Based Project",
      impact: "Very High",
      category: "Project Evidence",

      fixes: [
        "Project Quality Gap",
        "Project Evidence Gap",
        "Deployment Gap"
      ],

      action:
        `Build one ${role} focused project with authentication, APIs, database, deployment, and README.`,

      estimatedTime: "5-7 days",

      priorityScore: 100
    });
  }

  // 2. Missing Skills
  missingSkills.forEach((skill) => {
    priorities.push({
      title: `Learn ${skill.skill}`,
      impact: skill.weight >= 15 ? "High" : "Medium",
      category: "Skill Gap",

      fixes: [
        "Skill Gap",
        `${skill.skill} missing`
      ],

      action:
        `Practice and build mini tasks using ${skill.skill}.`,

      estimatedTime:
        skill.weight >= 15 ? "2-3 days" : "1-2 days",

      priorityScore: skill.weight * 4
    });
  });

  // 3. Weak Skills
  weakSkills.forEach((skill) => {
    priorities.push({
      title: `Improve ${skill.skill}`,
      impact: "Medium",
      category: "Skill Depth",

      fixes: [
        "Depth Gap"
      ],

      action:
        `Improve depth and practical usage of ${skill.skill}.`,

      estimatedTime: "1-2 days",

      priorityScore: skill.weight * 2
    });
  });

  // 4. Deployment
  const hasDeploymentGap = realityGap.some(
    gap => gap.type === "Deployment Gap"
  );

  if (hasDeploymentGap) {
    priorities.push({
      title: "Deploy Your Project",
      impact: "Medium",
      category: "Deployment",

      fixes: [
        "Deployment Gap"
      ],

      action:
        "Deploy your frontend/backend and attach live links.",

      estimatedTime: "1 day",

      priorityScore: 55
    });
  }

  // Sort by importance
  priorities.sort((a, b) => b.priorityScore - a.priorityScore);

  return priorities.slice(0, 6);
};

module.exports = {
  generateImprovementPriorities
};