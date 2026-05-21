const mongoose = require("mongoose");

const technicalSkillSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  { _id: false }
);

const projectFeaturesSchema = new mongoose.Schema(
  {
    authentication: { type: Boolean, default: false },
    database: { type: Boolean, default: false },
    restApi: { type: Boolean, default: false },
    dashboard: { type: Boolean, default: false },
    charts: { type: Boolean, default: false },
    roleBasedAccess: { type: Boolean, default: false },
    deployment: { type: Boolean, default: false },
    readme: { type: Boolean, default: false },
    errorHandling: { type: Boolean, default: false },
    testing: { type: Boolean, default: false },
    responsiveUI: { type: Boolean, default: false },
    apiIntegration: { type: Boolean, default: false },
    fileUpload: { type: Boolean, default: false },
    paymentIntegration: { type: Boolean, default: false },
    adminPanel: { type: Boolean, default: false }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },

    type: {
      type: String,
      enum: [
        "Frontend",
        "Backend",
        "Full Stack",
        "AI/ML",
        "Data Analytics",
        "DevOps/Cloud"
      ],
      default: "Full Stack"
    },

    problemSolved: {
      type: String,
      trim: true
    },

    techStack: {
      type: [String],
      default: []
    },

    githubLink: {
      type: String,
      trim: true
    },

    liveLink: {
      type: String,
      trim: true
    },

    features: {
      type: projectFeaturesSchema,
      default: () => ({})
    }
  },
  { _id: false }
);

const dsaSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner"
    },

    problemsSolvedRange: {
      type: String,
      enum: ["0-25", "25-75", "75-150", "150+"],
      default: "0-25"
    }
  },
  { _id: false }
);

const coreSubjectsSchema = new mongoose.Schema(
  {
    oop: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    dbms: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    os: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    cn: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    }
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true
    },

    // New stack field used by stack-based role data
    selectedStack: {
      type: String,
      required: true,
      trim: true
    },

    // Kept for old data/backward compatibility
    preferredStack: {
      type: String,
      trim: true
    },

    cgpa: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },

    internshipMonths: {
      type: Number,
      default: 0,
      min: 0
    },

    technicalSkills: {
      type: [technicalSkillSchema],
      default: []
    },

    tools: {
      type: [String],
      default: []
    },

    projects: {
      type: [projectSchema],
      default: []
    },

    githubUsername: {
      type: String,
      trim: true
    },

    dsa: {
      type: dsaSchema,
      default: () => ({})
    },

    coreSubjects: {
      type: coreSubjectsSchema,
      default: () => ({})
    },

    strengths: {
      type: [String],
      default: []
    },

    weaknesses: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },

    username: {
      type: String,
      required: true,
      trim: true
    },

    roles: {
      type: [roleSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Profile || mongoose.model("Profile", profileSchema);