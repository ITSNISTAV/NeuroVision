const mongoose = require('mongoose');

const technicalSkillSchema = new mongoose.Schema(
  {
    skill: { type: String, trim: true },
    level: { type: Number }
  },
  { _id: false }
);

const roleProfileSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, trim: true },
    cgpa: { type: Number, min: 0, max: 10 },
    internshipMonths: { type: Number, min: 0, default: 0 },
    technicalSkills: { type: [technicalSkillSchema], default: [] }
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, trim: true },
    roles: { type: [roleProfileSchema], default: [] },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    collection: 'profiles',
    timestamps: true
  }
);

const tutorialReviewSchema = new mongoose.Schema(
  {
    reviewer: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5 },
    comment: { type: String, trim: true }
  },
  { _id: false }
);

const tutorialLinkSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    tutorial: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    averageCompletionTime: { type: String, default: '3-5 hours', trim: true },
    difficulty: { type: String, default: 'Beginner', trim: true },
    prerequisites: { type: [String], default: [] },
    learningPath: { type: [String], default: [] },
    reviews: { type: [tutorialReviewSchema], default: [] },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    collection: 'tutoriallinks',
    timestamps: true
  }
);

const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);
const TutorialLink = mongoose.models.TutorialLink || mongoose.model('TutorialLink', tutorialLinkSchema);

module.exports = { Profile, TutorialLink };