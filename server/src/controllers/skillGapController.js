const { readData: readRoleData } = require('../utils/role.util');
const { readData: readProfileData } = require('../utils/file.util');
const { Profile, TutorialLink } = require('../models/skillGap.models');

const localTutorialLinks = require('../data/tutorialLinks.json');

const normalizeSkillKey = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tutorialAliases = {
  'express js': 'express',
  'expressjs': 'express',
  'react js': 'react',
  'reactjs': 'react',
  'rest api': 'rest apis',
  'restapi': 'rest apis',
  'restapis': 'rest apis',
  'jwt auth': 'jwt authentication'
};

const buildTutorialMap = (tutorialLinks) => new Map(
  Object.entries(tutorialLinks).map(([key, val]) => [normalizeSkillKey(key), val])
);

const toTutorialObject = (entry) => {
  if (!entry) {
    return {};
  }

  if (typeof entry === 'string') {
    return { tutorial: entry };
  }

  return entry;
};

const getNonEmptyArray = (value, fallback = []) => (
  Array.isArray(value) && value.length > 0 ? value : fallback
);

const mergeTutorialEntry = (localEntry, mongoDoc) => {
  const local = toTutorialObject(localEntry);

  return {
    tutorial: mongoDoc.tutorial || local.tutorial,
    description: mongoDoc.description || local.description,
    averageCompletionTime: mongoDoc.averageCompletionTime || local.averageCompletionTime,
    difficulty: mongoDoc.difficulty || local.difficulty,
    prerequisites: getNonEmptyArray(mongoDoc.prerequisites, Array.isArray(local.prerequisites) ? local.prerequisites : []),
    learningPath: getNonEmptyArray(mongoDoc.learningPath, Array.isArray(local.learningPath) ? local.learningPath : []),
    reviews: getNonEmptyArray(mongoDoc.reviews, Array.isArray(local.reviews) ? local.reviews : [])
  };
};

const getTutorialLinksData = async () => {
  if (Profile.db.readyState === 1) {
    try {
      const docs = await TutorialLink.find({}, { _id: 0, __v: 0 }).lean();
      if (docs.length > 0) {
        const mongoTutorialLinks = docs.reduce((acc, doc) => {
          if (!doc.key) {
            return acc;
          }

          acc[doc.key] = mergeTutorialEntry(localTutorialLinks[doc.key], doc);

          return acc;
        }, {});

        // Keep local JSON as fallback so missing Mongo keys still return rich metadata.
        return {
          ...localTutorialLinks,
          ...mongoTutorialLinks
        };
      }
    } catch (error) {
      console.warn('[SkillGap] Mongo tutorial load failed, using local JSON fallback.');
    }
  }

  return localTutorialLinks;
};

const getUserProfile = async (id) => {
  if (Profile.db.readyState === 1) {
    try {
      const mongoUser = await Profile.findOne({ id }).lean();
      if (mongoUser) {
        return mongoUser;
      }
    } catch (error) {
      console.warn('[SkillGap] Mongo profile load failed, using local JSON fallback.');
    }
  }

  const profileData = readProfileData();
  return profileData.users.find((u) => u.id === id);
};

const getTutorialDetails = (skillName, tutorialMap) => {
  const defaultTutorial = `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(skillName)}`;
  const normalizedName = normalizeSkillKey(skillName);
  const compactName = normalizedName.replace(/\s+/g, '');
  const aliasName = tutorialAliases[normalizedName] || tutorialAliases[compactName] || '';
  const lookupKeys = [normalizedName, compactName, aliasName]
    .filter(Boolean)
    .map((key) => normalizeSkillKey(key));
  const entry = lookupKeys.map((key) => tutorialMap.get(key)).find(Boolean);

  // Backward-compatible: supports both string and object tutorial formats.
  if (!entry) {
    return {
      tutorial: defaultTutorial,
      description: `Curated learning material for ${skillName}.`,
      averageCompletionTime: '3-5 hours',
      difficulty: 'Beginner',
      prerequisites: [],
      learningPath: [],
      reviews: [],
      averageRating: null
    };
  }

  if (typeof entry === 'string') {
    return {
      tutorial: entry,
      description: `Curated learning material for ${skillName}.`,
      averageCompletionTime: '3-5 hours',
      difficulty: 'Beginner',
      prerequisites: [],
      learningPath: [],
      reviews: [],
      averageRating: null
    };
  }

  const reviews = Array.isArray(entry.reviews) ? entry.reviews : [];
  const averageRating = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1))
    : null;

  return {
    tutorial: entry.tutorial || defaultTutorial,
    description: entry.description || `Curated learning material for ${skillName}.`,
    averageCompletionTime: entry.averageCompletionTime || '3-5 hours',
    difficulty: entry.difficulty || 'Beginner',
    prerequisites: Array.isArray(entry.prerequisites) ? entry.prerequisites : [],
    learningPath: Array.isArray(entry.learningPath) ? entry.learningPath : [],
    reviews,
    averageRating
  };
};

const getCgpaStatus = (cgpa) => {
  if (cgpa >= 9.0) return { status: "Excellent Academic Performance 🌟", bonus: " You have outstanding academic foundation." };
  if (cgpa >= 8.5) return { status: "Very Good Academic Performance 👑",  bonus: " Your academics are excellent." };
  if (cgpa >= 8.0) return { status: "Good Academic Performance 👍",        bonus: " You have strong academic record." };
  if (cgpa >= 7.0) return { status: "Average Academic Performance 📚",     bonus: " Focus more on practical skills." };
  if (cgpa >= 6.0) return { status: "Below Average Academic Performance 📝", bonus: " Prioritize skill development urgently." };
  return           { status: "Low Academic Performance ⚠️",                bonus: " Need significant improvement in academics and skills." };
};

const getRecommendation = (compatibilityScore, cgpa, cgpaBonus, targetRole, missingSkills) => {
  if (compatibilityScore >= 80 && cgpa >= 8.0)
    return `Excellent! You're ${compatibilityScore}% ready for ${targetRole}. Focus on: ${missingSkills.slice(0, 2).join(", ") || "refinement"}`;
  if (compatibilityScore >= 60 && cgpa >= 7.5)
    return `Good progress! You're ${compatibilityScore}% ready. Learn: ${missingSkills.join(", ") || "advanced topics"}`;
  if (compatibilityScore >= 40)
    return `You have ${compatibilityScore}% skill alignment.${cgpaBonus} Priority: ${missingSkills.slice(0, 3).join(", ")}`;
  return `You're ${compatibilityScore}% ready.${cgpaBonus} Recommended: Learn ${missingSkills.slice(0, 4).join(", ")}. Consider internships.`;
};

exports.analyzeSkillGap = async (req, res) => {
  try {
    const { id } = req.params;
    const selectedRole = req.query.role;

    if (!id) {
      return res.status(400).json({ error: "User id is required" });
    }

    const user = await getUserProfile(id);
    if (!user || !Array.isArray(user.roles) || user.roles.length === 0) {
      return res.status(404).json({ error: "Saved profile not found for this user" });
    }

    const profile = selectedRole
      ? user.roles.find(r => r.role === selectedRole)
      : user.roles[0];

    if (!profile) {
      return res.status(404).json({ error: "Saved role profile not found" });
    }

    const targetRole = profile.role;
    const cgpa = Number(profile.cgpa);

    if (!targetRole || Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      return res.status(400).json({ error: "Saved profile must contain valid targetRole and CGPA (0-10)" });
    }

    const technicalSkills = Array.isArray(profile.technicalSkills)
      ? profile.technicalSkills.map(skill => (typeof skill === 'string' ? skill : skill.skill)).filter(Boolean)
      : [];

    const roleData = await readRoleData();
    const matchedRole = roleData.roles.find(r => r.role === targetRole);
    if (!matchedRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    const userSkills = technicalSkills.map(s => String(s).toLowerCase());
    const requiredSkills = matchedRole.skills;

    const matchedSkills = requiredSkills.filter(s => userSkills.includes(s.name.toLowerCase()));
    const missingSkills = requiredSkills.filter(s => !userSkills.includes(s.name.toLowerCase()));

    const compatibilityScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);

    const { status: cgpaStatus, bonus: cgpaBonus } = getCgpaStatus(cgpa);
    const missingNames = missingSkills.map(s => s.name);
    const tutorialLinks = await getTutorialLinksData();
    const tutorialMap = buildTutorialMap(tutorialLinks);

    return res.status(200).json({
      targetRole,
      cgpa,
      cgpaStatus,
      compatibilityScore,
      matchedSkills: matchedSkills.map(s => s.name),
      missingSkills: missingNames,
      missingSkillsWithTutorials: missingNames.map(name => ({
        skill: name,
        ...getTutorialDetails(name, tutorialMap)
      })),
      recommendation: getRecommendation(compatibilityScore, cgpa, cgpaBonus, targetRole, missingNames)
    });

  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};