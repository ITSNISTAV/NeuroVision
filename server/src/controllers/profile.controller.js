const Profile = require('../models/Profile')
const { readData: readUsersData } = require('../utils/user.util')

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.id })
    if (!profile) return res.json({ roles: [] })
    res.json({ roles: profile.roles })
  } catch (err) {
    console.error('getProfile error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.saveProfile = async (req, res) => {
  const { role, cgpa, internshipMonths, technicalSkills } = req.body

  if (!role || !cgpa || !technicalSkills || technicalSkills.length === 0)
    return res.status(400).json({ message: 'Required fields missing' })

  if (cgpa < 1 || cgpa > 10)
    return res.status(400).json({ message: 'CGPA must be between 1 and 10' })

  try {
    let profile = await Profile.findOne({ userId: req.params.id })

    if (!profile) {
      const usersData = await readUsersData()
      const actualUser = usersData.find(u => u.id === req.params.id)
      const username = actualUser ? actualUser.name : 'unknown'
      profile = new Profile({ userId: req.params.id, username, roles: [] })
    }

    const exists = profile.roles.find(r => r.role === role)
    if (exists)
      return res.status(400).json({ message: 'Role already saved. Use Edit to update it.' })

    profile.roles.push({ role, cgpa, internshipMonths, technicalSkills })
    await profile.save()
    res.json({ message: 'Profile saved successfully!' })
  } catch (err) {
    console.error('saveProfile error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.updateRole = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.id })
    if (!profile) return res.status(404).json({ message: 'User not found' })

    const index = profile.roles.findIndex(r => r.role === req.params.role)
    if (index === -1) return res.status(404).json({ message: 'Role not found' })

    profile.roles[index] = req.body
    await profile.save()
    res.json({ message: 'Role updated successfully!' })
  } catch (err) {
    console.error('updateRole error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.deleteRole = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.id })
    if (!profile) return res.status(404).json({ message: 'User not found' })

    profile.roles = profile.roles.filter(r => r.role !== req.params.role)
    await profile.save()
    res.json({ message: 'Role deleted.' })
  } catch (err) {
    console.error('deleteRole error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}