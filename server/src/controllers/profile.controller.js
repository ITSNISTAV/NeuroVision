const { readData, writeData } = require("../utils/file.util");
const { readData: readUsersData } = require("../utils/user.util");

exports.getProfile = (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.params.id);
  
  if (user && !Array.isArray(user.roles)) user.roles = [];
  res.json(user || { roles: [] });
};

exports.saveProfile = async (req, res) => {
  const data = readData();
  let user = data.users.find(u => u.id === req.params.id);

  const { role, cgpa, internshipMonths, technicalSkills } = req.body;

  if (!role || !cgpa || !technicalSkills || technicalSkills.length === 0) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  if (cgpa < 1 || cgpa > 10) {
    return res.status(400).json({ message: "CGPA must be between 1 and 10" });
  }

  if (!user) {
    // Get actual username from users.json
    const usersData = await readUsersData();
    const actualUser = usersData.find(u => u.id === req.params.id);
    const username = actualUser ? actualUser.name : "unknown";
    
    user = { id: req.params.id, username, roles: [] };
    data.users.push(user);
  }

  
  if (!Array.isArray(user.roles)) {
    user.roles = [];
  }

  
  const existingIndex = user.roles.findIndex(r => r.role === role);
  if (existingIndex !== -1) {
    return res.status(400).json({ message: "Role already saved. Use Edit to update it." });
  }

  user.roles.push({ role, cgpa, internshipMonths, technicalSkills });
  writeData(data);
  res.json({ message: "Profile saved successfully!" });
};

exports.updateRole = (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });
  if (!Array.isArray(user.roles)) return res.status(404).json({ message: "No roles found" });

  const index = user.roles.findIndex(r => r.role === req.params.role);
  if (index === -1) return res.status(404).json({ message: "Role not found" });

  user.roles[index] = req.body;
  writeData(data);
  res.json({ message: "Role updated successfully!" });
};

exports.deleteRole = (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });
  if (!Array.isArray(user.roles)) return res.status(404).json({ message: "No roles found" });

  user.roles = user.roles.filter(r => r.role !== req.params.role);
  writeData(data);
  res.json({ message: "Role deleted." });
};

