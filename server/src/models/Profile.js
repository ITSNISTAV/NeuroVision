const mongoose = require('mongoose')

const technicalSkillSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  level: { type: Number, required: true, min: 1, max: 10 }
}, { _id: false })

const roleSchema = new mongoose.Schema({
  role:             { type: String, required: true },
  cgpa:             { type: Number, required: true, min: 1, max: 10 },
  internshipMonths: { type: Number, default: 0 },
  technicalSkills:  { type: [technicalSkillSchema], default: [] }
}, { _id: false })

const profileSchema = new mongoose.Schema({
  userId:   { type: String, required: true, unique: true },
  username: { type: String, required: true },
  roles:    { type: [roleSchema], default: [] }
}, { timestamps: true })

module.exports = mongoose.model('Profile', profileSchema)