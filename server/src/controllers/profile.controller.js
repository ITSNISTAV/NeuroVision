const Profile = require('../models/Profile');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper to validate role data according to schema constraints
const validateRoleData = (data) => {
  const {
    role,
    selectedStack,
    cgpa,
    internshipMonths,
    technicalSkills,
    projects,
    dsa,
    coreSubjects,
    tools,
    strengths,
    weaknesses,
  } = data;

  if (!role || typeof role !== 'string' || !role.trim()) {
    return 'Role is required and must be a valid string.';
  }

  if (!selectedStack || typeof selectedStack !== 'string' || !selectedStack.trim()) {
    return 'Selected stack is required and must be a valid string.';
  }

  if (cgpa === undefined || cgpa === null || isNaN(cgpa)) {
    return 'CGPA is required.';
  }
  const cg = Number(cgpa);
  if (cg < 1 || cg > 10) {
    return 'CGPA must be between 1 and 10.';
  }

  if (internshipMonths !== undefined && internshipMonths !== null) {
    const im = Number(internshipMonths);
    if (isNaN(im) || im < 0) {
      return 'Internship months must be a non-negative number.';
    }
  }

  if (technicalSkills && !Array.isArray(technicalSkills)) {
    return 'Technical skills must be an array.';
  }

  if (technicalSkills) {
    for (const ts of technicalSkills) {
      if (!ts.skill || typeof ts.skill !== 'string' || !ts.skill.trim()) {
        return 'Every skill must have a valid name.';
      }
      const lvl = Number(ts.level);
      if (isNaN(lvl) || lvl < 1 || lvl > 5) {
        return `Skill level for ${ts.skill} must be between 1 and 5.`;
      }
    }
  }

  if (tools && !Array.isArray(tools)) {
    return 'Tools must be an array of strings.';
  }

  if (strengths && !Array.isArray(strengths)) {
    return 'Strengths must be an array of strings.';
  }

  if (weaknesses && !Array.isArray(weaknesses)) {
    return 'Weaknesses must be an array of strings.';
  }

  if (dsa) {
    if (dsa.level && !["Beginner", "Intermediate", "Advanced"].includes(dsa.level)) {
      return 'DSA level must be Beginner, Intermediate, or Advanced.';
    }
    if (dsa.problemsSolvedRange && !["0-25", "25-75", "75-150", "150+"].includes(dsa.problemsSolvedRange)) {
      return 'DSA problems solved range must be one of "0-25", "25-75", "75-150", "150+".';
    }
  }

  if (coreSubjects) {
    const subjects = ['oop', 'dbms', 'os', 'cn'];
    for (const sub of subjects) {
      if (coreSubjects[sub] !== undefined && coreSubjects[sub] !== null) {
        const val = Number(coreSubjects[sub]);
        if (isNaN(val) || val < 1 || val > 5) {
          return `Core subject ${sub.toUpperCase()} score must be between 1 and 5.`;
        }
      }
    }
  }

  if (projects && !Array.isArray(projects)) {
    return 'Projects must be an array.';
  }

  if (projects) {
    const projectTypes = ["Frontend", "Backend", "Full Stack", "AI/ML", "Data Analytics", "DevOps/Cloud"];
    for (const proj of projects) {
      if (!proj.name || typeof proj.name !== 'string' || !proj.name.trim()) {
        return 'Project name is required.';
      }
      if (proj.type && !projectTypes.includes(proj.type)) {
        return `Project type must be one of: ${projectTypes.join(', ')}`;
      }
      if (proj.techStack && !Array.isArray(proj.techStack)) {
        return 'Project tech stack must be an array of strings.';
      }
    }
  }

  return null;
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.id });
    if (!profile) return res.json({ roles: [] });
    res.json({ roles: profile.roles });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.saveProfile = async (req, res) => {
  const validationError = validateRoleData(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const {
    role,
    selectedStack,
    preferredStack,
    cgpa,
    internshipMonths,
    technicalSkills,
    tools,
    projects,
    githubUsername,
    dsa,
    coreSubjects,
    strengths,
    weaknesses,
  } = req.body;

  try {
    let profile = await Profile.findOne({ userId: req.params.id });

    if (!profile) {
      let username = 'unknown';
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        const user = await User.findById(req.params.id).select('name');
        username = user ? user.name : 'unknown';
      }
      profile = new Profile({ userId: req.params.id, username, roles: [] });
    }

    const exists = profile.roles.find(r => r.role.toLowerCase() === role.toLowerCase());
    if (exists) {
      return res.status(400).json({ message: 'Role already saved. Use Edit to update it.' });
    }

    profile.roles.push({
      role,
      selectedStack,
      preferredStack,
      cgpa: Number(cgpa),
      internshipMonths: Number(internshipMonths || 0),
      technicalSkills: technicalSkills || [],
      tools: tools || [],
      projects: projects || [],
      githubUsername,
      dsa: dsa || {},
      coreSubjects: coreSubjects || {},
      strengths: strengths || [],
      weaknesses: weaknesses || []
    });

    await profile.save();
    res.json({ message: 'Profile saved successfully!' });
  } catch (err) {
    console.error('saveProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRole = async (req, res) => {
  const validationError = validateRoleData(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const profile = await Profile.findOne({ userId: req.params.id });
    if (!profile) return res.status(404).json({ message: 'User not found' });

    const index = profile.roles.findIndex(r => r.role.toLowerCase() === req.params.role.toLowerCase());
    if (index === -1) return res.status(404).json({ message: 'Role not found' });

    // Update the role fields safely
    const {
      role,
      selectedStack,
      preferredStack,
      cgpa,
      internshipMonths,
      technicalSkills,
      tools,
      projects,
      githubUsername,
      dsa,
      coreSubjects,
      strengths,
      weaknesses,
    } = req.body;

    profile.roles[index] = {
      role,
      selectedStack,
      preferredStack,
      cgpa: Number(cgpa),
      internshipMonths: Number(internshipMonths || 0),
      technicalSkills: technicalSkills || [],
      tools: tools || [],
      projects: projects || [],
      githubUsername,
      dsa: dsa || {},
      coreSubjects: coreSubjects || {},
      strengths: strengths || [],
      weaknesses: weaknesses || []
    };

    await profile.save();
    res.json({ message: 'Role updated successfully!' });
  } catch (err) {
    console.error('updateRole error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.id });
    if (!profile) return res.status(404).json({ message: 'User not found' });

    profile.roles = profile.roles.filter(r => r.role.toLowerCase() !== req.params.role.toLowerCase());
    await profile.save();
    res.json({ message: 'Role deleted.' });
  } catch (err) {
    console.error('deleteRole error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};