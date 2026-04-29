const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const DEMO_USER_ID = "skillgap-demo-user";

const seedRoles = [
  {
    role: "Backend Developer",
    cgpa: 8.7,
    internshipMonths: 5,
    technicalSkills: [
      { skill: "Node.js", level: 8 },
      { skill: "Express.js", level: 7 },
      { skill: "MongoDB", level: 6 },
      { skill: "Git", level: 8 }
    ]
  },
  {
    role: "Frontend Developer",
    cgpa: 7.9,
    internshipMonths: 3,
    technicalSkills: [
      { skill: "HTML", level: 8 },
      { skill: "CSS", level: 8 },
      { skill: "JavaScript", level: 7 },
      { skill: "React.js", level: 6 }
    ]
  },
  {
    role: "Data Analyst",
    cgpa: 8.2,
    internshipMonths: 4,
    technicalSkills: [
      { skill: "Python", level: 7 },
      { skill: "SQL", level: 7 },
      { skill: "Excel", level: 8 },
      { skill: "Power BI", level: 6 }
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

async function upsertMongoSeed() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn("[Mongo Seed] MONGODB_URI not found. Skipping MongoDB seeding.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 });
    const db = mongoose.connection.db;

    await db.collection("profiles").updateOne(
      { id: DEMO_USER_ID },
      {
        $set: {
          id: DEMO_USER_ID,
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
  const mongoSeeded = await upsertMongoSeed();

  console.log("SkillGap seed completed.");
  console.log(`Seeded demo user: ${DEMO_USER_ID}`);
  console.log(`Seeded roles (mongo payload): ${seedRoles.length}`);
  console.log(`Upserted tutorial entries (mongo payload): ${Object.keys(tutorialSeed).length}`);
  console.log(`Mongo seed status: ${mongoSeeded ? "done" : "skipped/failed"}`);
}

main();
