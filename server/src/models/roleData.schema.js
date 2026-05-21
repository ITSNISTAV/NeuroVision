const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    requiredLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    weight: {
      type: Number,
      required: true
    },

    practiceTask: {
      type: String,
      default: ""
    },

    dependencyChain: {
      type: [String],
      default: []
    },

    miniProjects: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const stackSchema = new mongoose.Schema(
  {
    stackName: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    skills: {
      type: [skillSchema],
      default: []
    }
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    stacks: {
      type: [stackSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Role ||
  mongoose.model("Role", roleSchema);