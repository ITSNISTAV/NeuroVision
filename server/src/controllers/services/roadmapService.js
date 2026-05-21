const generateRoadmap = (
  role,
  skillBreakdown = [],
  projectQuality = {},
  realityGap = [],
  improvementPriorities = []
) => {
  const roadmap = [];

  const missingSkills = skillBreakdown.filter(s => s.status === "missing");
  const weakSkills = skillBreakdown.filter(s => s.status === "needs_improvement");

  if (missingSkills.length > 0) {
    roadmap.push({
      phase: 1,
      title: "Fix Core Skill Gaps",
      duration: "3-5 days",
      goal: `Build the missing foundation for ${role}.`,
      tasks: missingSkills.slice(0, 4).map(s => `Learn and practice ${s.skill}.`),
      output: "Basic practice examples and notes for each missing skill."
    });
  }

  if (weakSkills.length > 0) {
    roadmap.push({
      phase: roadmap.length + 1,
      title: "Improve Skill Depth",
      duration: "2-4 days",
      goal: "Improve skills that are present but below required level.",
      tasks: weakSkills.slice(0, 3).map(s => `Build mini examples using ${s.skill}.`),
      output: "Small working demos that prove skill depth."
    });
  }

  if (!projectQuality.overallScore || projectQuality.overallScore < 60) {
    roadmap.push({
      phase: roadmap.length + 1,
      title: "Build Role-Based Project",
      duration: "5-7 days",
      goal: `Create strong project evidence for ${role}.`,
      tasks: [
        `Build one ${role} focused project.`,
        "Add database or API integration where relevant.",
        "Add authentication if relevant.",
        "Use GitHub from day one.",
        "Write clean README documentation."
      ],
      output: "One strong GitHub project that proves role readiness."
    });
  }

  const hasDeploymentGap = realityGap.some(g => g.type === "Deployment Gap");

  if (hasDeploymentGap) {
    roadmap.push({
      phase: roadmap.length + 1,
      title: "Deploy And Document",
      duration: "1-2 days",
      goal: "Make your work publicly verifiable.",
      tasks: [
        "Deploy frontend/backend.",
        "Add live project link.",
        "Add screenshots to README.",
        "Add setup instructions.",
        "Attach GitHub link to profile."
      ],
      output: "Public live link and professional README."
    });
  }

  if (improvementPriorities.length > 0) {
    roadmap.push({
      phase: roadmap.length + 1,
      title: "Polish For Interviews",
      duration: "3-4 days",
      goal: "Prepare to explain your skills and project clearly.",
      tasks: [
        "Prepare 2-minute project explanation.",
        "Revise role-specific concepts.",
        "Practice common viva/interview questions.",
        "Update resume and portfolio."
      ],
      output: "Interview-ready project explanation and improved resume."
    });
  }

  if (roadmap.length === 0) {
    roadmap.push({
      phase: 1,
      title: "Polish And Apply",
      duration: "1 week",
      goal: "Your profile has good readiness. Focus on applications.",
      tasks: [
        "Update resume.",
        "Polish GitHub README files.",
        "Add projects to portfolio.",
        "Start applying to internships."
      ],
      output: "Application-ready developer profile."
    });
  }

  return roadmap;
};

module.exports = { generateRoadmap };