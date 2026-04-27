const mongoose = require('mongoose');

// 1. Define the Skill Schema (Subdocument)
const skillSchema = new mongoose.Schema({
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
  }
}, { _id: false }); // Set _id to false if you don't need unique IDs for every skill entry


const roleSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  skills: [skillSchema] // Array of skill subdocuments
});

// 3. Create the Model
const Role = mongoose.model('Role', roleSchema);

module.exports = Role;