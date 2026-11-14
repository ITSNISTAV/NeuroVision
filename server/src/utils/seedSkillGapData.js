const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const profilePath = path.join(__dirname, "../data/profile.json");
const tutorialPath = path.join(__dirname, "../data/tutorialLinks.json");

const DEMO_USER_ID = "skillgap-demo-user";

const seedRoles = [
  {
    role: "Backend Developer",
    preferredStack: "MERN / Node.js",
    cgpa: 8.7,
    internshipMonths: 5,
    githubUsername: "backend-guru",
    technicalSkills: [
      { skill: "Node.js", level: 5 },
      { skill: "Express.js", level: 4 },
      { skill: "MongoDB", level: 4 },
      { skill: "Git", level: 5 }
    ],
    tools: ["VS Code", "Postman", "Docker"],
    strengths: ["Problem Solving", "Database Design"],
    weaknesses: ["Frontend CSS", "Public Speaking"],
    dsa: {
      level: "Intermediate",
      problemsSolvedRange: "75-150"
    },
    coreSubjects: {
      oop: 4,
      dbms: 5,
      os: 4,
      cn: 4
    },
    projects: [
      {
        name: "E-Commerce API",
        type: "Backend",
        problemSolved: "Created a scalable e-commerce REST API backend with secure payment processing and inventory tracking.",
        techStack: ["Node.js", "Express", "MongoDB", "Stripe"],
        githubLink: "https://github.com/backend-guru/ecommerce-api",
        liveLink: "https://ecommerce-api.demo.com",
        features: {
          authentication: true,
          database: true,
          restApi: true,
          paymentIntegration: true,
          errorHandling: true
        }
      }
    ]
  },
  {
    role: "Frontend Developer",
    preferredStack: "React / Next.js",
    cgpa: 7.9,
    internshipMonths: 3,
    githubUsername: "pixel-perfect",
    technicalSkills: [
      { skill: "HTML", level: 5 },
      { skill: "CSS", level: 5 },
      { skill: "JavaScript", level: 4 },
      { skill: "React.js", level: 4 }
    ],
    tools: ["Figma", "VS Code", "Webpack"],
    strengths: ["UI/UX Design", "Responsive Layouts"],
    weaknesses: ["SQL Queries", "System Architecture"],
    dsa: {
      level: "Beginner",
      problemsSolvedRange: "25-75"
    },
    coreSubjects: {
      oop: 3,
      dbms: 2,
      os: 3,
      cn: 2
    },
    projects: [
      {
        name: "SaaS Landing Page",
        type: "Frontend",
        problemSolved: "Designed and built a highly responsive, modern landing page with smooth animations and interactive product walkthroughs.",
        techStack: ["React", "Vite", "Tailwind CSS"],
        githubLink: "https://github.com/pixel-perfect/saas-page",
        liveLink: "https://saas-demo.com",
        features: {
          responsiveUI: true,
          readme: true,
          testing: true
        }
      }
    ]
  },
  {
    role: "Data Analyst",
    preferredStack: "Python / SQL",
    cgpa: 8.2,
    internshipMonths: 4,
    githubUsername: "data-wizard",
    technicalSkills: [
      { skill: "Python", level: 4 },
      { skill: "SQL", level: 4 },
      { skill: "Excel", level: 5 },
      { skill: "Power BI", level: 3 }
    ],
    tools: ["Jupyter Notebook", "Tableau", "Excel"],
    strengths: ["Statistical Analysis", "Data Visualization"],
    weaknesses: ["Object Oriented Programming", "Web Security"],
    dsa: {
      level: "Beginner",
      problemsSolvedRange: "0-25"
    },
    coreSubjects: {
      oop: 2,
      dbms: 4,
      os: 2,
      cn: 2
    },
    projects: [
      {
        name: "Sales Insight Dashboard",
        type: "Data Analytics",
        problemSolved: "Cleaned and processed raw sales data to build interactive reports showing growth regions.",
        techStack: ["Python", "Pandas", "Power BI", "SQL"],
        githubLink: "https://github.com/data-wizard/sales-insights",
        liveLink: "https://sales-insights.demo.com",
        features: {
          database: true,
          dashboard: true,
          charts: true
        }
      }
    ]
  }
];

const tutorialSeed = {
  "Express.js": {
    tutorial: "https://www.geeksforgeeks.org/express-js/",
    description: "Build backend APIs with routes, middleware, and robust error handling.",
    averageCompletionTime: "5-8 hours",
    difficulty: "Beginner",
    prerequisites: ["Node.js basics"],
    learningPath: ["Setup project", "Build routes", "Add middleware", "Handle errors"],
    reviews: [
      { reviewer: "NeuroVision Seed", rating: 4.6, comment: "Great for practical API building." }
    ]
  },
  "React.js": {
    tutorial: "https://www.geeksforgeeks.org/reactjs/",
    description: "Create interactive UIs using components, hooks, and state management basics.",
    averageCompletionTime: "8-12 hours",
    difficulty: "Beginner to Intermediate",
    prerequisites: ["JavaScript basics"],
    learningPath: ["Understand JSX", "Build components", "Use hooks", "Build mini app"],
    reviews: [
      { reviewer: "NeuroVision Seed", rating: 4.7, comment: "Excellent intro for frontend growth." }
    ]
  },
  "Power BI": {
    tutorial: "https://www.geeksforgeeks.org/power-bi/",
    description: "Design clean dashboards and transform raw data into actionable insights.",
    averageCompletionTime: "7-10 hours",
    difficulty: "Intermediate",
    prerequisites: ["Basic data analysis"],
    learningPath: ["Import data", "Model relations", "Create visuals", "Publish dashboard"],
    reviews: [
      { reviewer: "NeuroVision Seed", rating: 4.5, comment: "Useful for portfolio-ready dashboards." }
    ]
  }
};

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function upsertProfileSeed() {
  const profileData = loadJson(profilePath);
  if (!Array.isArray(profileData.users)) {
    profileData.users = [];
  }

  const existingIndex = profileData.users.findIndex((user) => user.id === DEMO_USER_ID);
  const seededUser = {
    id: DEMO_USER_ID,
    username: "skillgap-demo",
    roles: seedRoles
  };

  if (existingIndex === -1) {
    profileData.users.push(seededUser);
  } else {
    profileData.users[existingIndex] = seededUser;
  }

  saveJson(profilePath, profileData);
  return seededUser.roles.length;
}

function upsertTutorialSeed() {
  const tutorialData = loadJson(tutorialPath);
  Object.entries(tutorialSeed).forEach(([key, value]) => {
    tutorialData[key] = value;
  });
  saveJson(tutorialPath, tutorialData);
  return Object.keys(tutorialSeed).length;
}

async function upsertMongoSeed() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn("[Mongo Seed] MongoDB URI not found. Skipping MongoDB seeding.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 });
    const db = mongoose.connection.db;

    await db.collection("profiles").updateOne(
      { userId: DEMO_USER_ID },
      {
        $set: {
          id: DEMO_USER_ID,
          userId: DEMO_USER_ID,
          username: "skillgap-demo",
          roles: seedRoles,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    for (const [key, value] of Object.entries(tutorialSeed)) {
      await db.collection("tutoriallinks").updateOne(
        { key },
        { $set: { key, ...value, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    console.log("MongoDB seeding completed successfully.");
    return true;
  } catch (error) {
    console.error("[Mongo Seed] Failed:", error.message);
    return false;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

async function main() {
  const roleCount = upsertProfileSeed();
  const tutorialCount = upsertTutorialSeed();
  const mongoSeeded = await upsertMongoSeed();

  console.log("SkillGap seed completed successfully.");
  console.log(`Seeded demo user: ${DEMO_USER_ID}`);
  console.log(`Seeded roles: ${roleCount}`);
  console.log(`Upserted tutorial entries: ${tutorialCount}`);
  console.log(`Mongo seed status: ${mongoSeeded ? "done" : "skipped/failed"}`);
}

main();
