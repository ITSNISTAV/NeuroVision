const path = require('path');
const fs = require('fs');

const base = path.join(__dirname, '../src/data');
const profile = JSON.parse(fs.readFileSync(path.join(base, 'profile.json'), 'utf8'));
const roleData = JSON.parse(fs.readFileSync(path.join(base, 'roleData.json'), 'utf8'));
const tutorialLinks = JSON.parse(fs.readFileSync(path.join(base, 'tutorialLinks.json'), 'utf8'));

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

const tutorialMap = buildTutorialMap(tutorialLinks);

function getTutorialDetails(skillName) {
  const defaultTutorial = `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(skillName)}`;
  const normalizedName = normalizeSkillKey(skillName);
  const compactName = normalizedName.replace(/\s+/g, '');
  const aliasName = tutorialAliases[normalizedName] || tutorialAliases[compactName] || '';
  const lookupKeys = [normalizedName, compactName, aliasName]
    .filter(Boolean)
    .map((key) => normalizeSkillKey(key));
  const entry = lookupKeys.map((key) => tutorialMap.get(key)).find(Boolean);

  if (!entry) {
    return { tutorial: defaultTutorial, description: `Curated learning material for ${skillName}.`, prerequisites: [], learningPath: [], reviews: [] };
  }

  return {
    tutorial: entry.tutorial || defaultTutorial,
    description: entry.description || `Curated learning material for ${skillName}.`,
    prerequisites: Array.isArray(entry.prerequisites) ? entry.prerequisites : [],
    learningPath: Array.isArray(entry.learningPath) ? entry.learningPath : [],
    reviews: Array.isArray(entry.reviews) ? entry.reviews : []
  };
}

const DEMO_USER_ID = 'skillgap-demo-user';
const user = profile.users.find(u => u.id === DEMO_USER_ID);
if (!user) return console.error('demo user not found');
const profileObj = user.roles.find(r => r.role === 'Backend Developer');
if (!profileObj) return console.error('role not found');

const technicalSkills = Array.isArray(profileObj.technicalSkills)
  ? profileObj.technicalSkills.map(s => (typeof s === 'string' ? s : s.skill)).filter(Boolean)
  : [];

const matchedRole = roleData.roles.find(r => r.role === 'Backend Developer');
if (!matchedRole) return console.error('matched role not found');

const userSkills = technicalSkills.map(s => String(s).toLowerCase());
const requiredSkills = matchedRole.skills;
const missingSkills = requiredSkills.filter(s => !userSkills.includes(s.name.toLowerCase()));

const missingNames = missingSkills.map(s => s.name);

const details = missingNames.map(name => ({ skill: name, tutorial: getTutorialDetails(name) }));

console.log(JSON.stringify({ missingNames, details }, null, 2));
