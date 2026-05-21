const Role = require('../models/roleData.schema');

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({});
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getRoleByName = async (req, res) => {
  try {
    const roleName = req.params.roleName;
    const role = await Role.findOne({ role: roleName });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
