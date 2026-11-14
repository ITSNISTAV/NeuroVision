const normalizeText = (value = "") => {
  return String(value)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .trim();
};

const getProjectLevel = (score) => {
  if (score >= 85) return "Production-Level";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Intermediate";
  if (score >= 30) return "Basic";
  return "Weak";
};

const ROLE_PROJECT_WEIGHTS = {
  "Backend Developer": {
    problemSolved: 5,
    techStackRelevant: 12,
    authentication: 12,
    database: 12,
    restApi: 15,
    errorHandling: 10,
    deployment: 10,
    testing: 8,
    readme: 8,
    roleBasedAccess: 8
  },

  "Frontend Developer": {
    problemSolved: 8,
    techStackRelevant: 12,
    responsiveUI: 15,
    apiIntegration: 12,
    dashboard: 8,
    deployment: 10,
    readme: 8,
    errorHandling: 7,
    testing: 8,
    charts: 5,
    authentication: 7
  },

  "Full Stack Developer": {
    problemSolved: 5,
    techStackRelevant: 10,
    authentication: 10,
    database: 10,
    restApi: 10,
    responsiveUI: 8,
    apiIntegration: 8,
    dashboard: 7,
    deployment: 10,
    readme: 7,
    errorHandling: 8,
    testing: 7
  },

  "Data Analyst": {
    problemSolved: 8,
    techStackRelevant: 10,
    dashboard: 15,
    charts: 15,
    readme: 7,
    deployment: 5,
    testing: 5
  },

  "Machine Learning Engineer": {
    problemSolved: 8,
    techStackRelevant: 12,
    readme: 8,
    deployment: 8,
    testing: 8,
    dashboard: 6,
    errorHandling: 5
  }
};

const FEATURE_LABELS = {
  problemSolved: "Clear problem statement",
  techStackRelevant: "Role-relevant tech stack",
  authentication: "Authentication",
  database: "Database",
  restApi: "REST API",
  dashboard: "Dashboard",
  charts: "Charts/analytics",
  roleBasedAccess: "Role-based access",
  deployment: "Deployment",
  readme: "README/documentation",
  errorHandling: "Error handling",
  testing: "Testing",
  responsiveUI: "Responsive UI",
  apiIntegration: "API integration"
};

const isTechStackRelevant = (project, roleDefinition) => {
  if (!project?.techStack?.length || !roleDefinition?.skills?.length) {
    return false;
  }

  const projectTech = project.techStack.map(normalizeText);
  const roleSkills = roleDefinition.skills.map((skill) =>
    normalizeText(skill.name)
  );

  return projectTech.some((tech) => roleSkills.includes(tech));
};

const analyzeSingleProject = (project, role, roleDefinition) => {
  const weights =
    ROLE_PROJECT_WEIGHTS[role] || ROLE_PROJECT_WEIGHTS["Full Stack Developer"];

  let score = 0;
  const strengths = [];
  const weaknesses = [];

  if (project.problemSolved && project.problemSolved.trim().length >= 25) {
    score += weights.problemSolved || 0;
    strengths.push("Project has a clear problem statement.");
  } else {
    weaknesses.push("Problem statement is weak or missing.");
  }

  if (isTechStackRelevant(project, roleDefinition)) {
    score += weights.techStackRelevant || 0;
    strengths.push("Project tech stack is relevant to the selected role.");
  } else {
    weaknesses.push("Project tech stack is not strongly aligned with the selected role.");
  }

  const features = project.features || {};

  Object.keys(weights).forEach((key) => {
    if (key === "problemSolved" || key === "techStackRelevant") return;

    if (features[key]) {
      score += weights[key];
      strengths.push(`${FEATURE_LABELS[key] || key} is present.`);
    } else {
      weaknesses.push(`${FEATURE_LABELS[key] || key} is missing.`);
    }
  });

  const finalScore = Math.min(Math.round(score), 100);

  return {
    projectName: project.name || "Untitled Project",
    score: finalScore,
    level: getProjectLevel(finalScore),
    strengths,
    weaknesses
  };
};

const analyzeProjectQuality = (projects = [], role, roleDefinition) => {
  if (!projects || projects.length === 0) {
    return {
      overallScore: 0,
      level: "No Evidence",
      bestProject: null,
      projects: [],
      strengths: [],
      weaknesses: [
        "No project evidence found. Add at least one role-based project to improve your readiness score."
      ]
    };
  }

  const analyzedProjects = projects.map((project) =>
    analyzeSingleProject(project, role, roleDefinition)
  );

  const bestProject = analyzedProjects.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  const overallScore = Math.round(
    analyzedProjects.reduce((sum, project) => sum + project.score, 0) /
      analyzedProjects.length
  );

  return {
    overallScore,
    level: getProjectLevel(overallScore),
    bestProject,
    projects: analyzedProjects,
    strengths: [...new Set(analyzedProjects.flatMap((project) => project.strengths))],
    weaknesses: [...new Set(analyzedProjects.flatMap((project) => project.weaknesses))]
  };
};

module.exports = {
  analyzeProjectQuality
};