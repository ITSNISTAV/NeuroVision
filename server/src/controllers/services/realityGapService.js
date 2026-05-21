const generateRealityGap = (profileRole, skillBreakdown = [], projectQuality = {}) => {
  const gaps = [];

  const missingSkills = skillBreakdown.filter(s => s.status === "missing");
  const weakSkills = skillBreakdown.filter(s => s.status === "needs_improvement");

  if (missingSkills.length > 0) {
    gaps.push({
      type: "Skill Gap",
      severity: "High",
      message: `Missing important skills: ${missingSkills.slice(0, 3).map(s => s.skill).join(", ")}.`
    });
  }

  if (weakSkills.length > 0) {
    gaps.push({
      type: "Depth Gap",
      severity: "Medium",
      message: `Some skills are below required level: ${weakSkills.slice(0, 3).map(s => s.skill).join(", ")}.`
    });
  }

  if (!profileRole.projects || profileRole.projects.length === 0) {
    gaps.push({
      type: "Project Evidence Gap",
      severity: "High",
      message: "No project evidence found. Your skills need proof through real projects."
    });
  }

  if (projectQuality.overallScore < 50) {
    gaps.push({
      type: "Project Quality Gap",
      severity: "High",
      message: "Project quality is weak or not proven yet. Add auth, database, APIs, deployment, and README."
    });
  }

  const hasDeployment = profileRole.projects?.some(
    p => p.features?.deployment || p.liveLink
  );

  if (!hasDeployment) {
    gaps.push({
      type: "Deployment Gap",
      severity: "Medium",
      message: "No deployed project found. Recruiters cannot quickly verify your work."
    });
  }

  const hasGithub = Boolean(profileRole.githubUsername) ||
    profileRole.projects?.some(p => p.githubLink);

  if (!hasGithub) {
    gaps.push({
      type: "GitHub Proof Gap",
      severity: "Medium",
      message: "GitHub proof is missing. Add GitHub links for your projects."
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      type: "No Major Gap",
      severity: "Low",
      message: "Your profile has strong evidence for this role. Focus on polish and applications."
    });
  }

  return gaps;
};

module.exports = { generateRealityGap };