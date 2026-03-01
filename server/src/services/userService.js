const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')
const { USERS_FILE } = require('../config')
const { readJson, writeJson } = require('../utils/fileStore')

function findByEmail(email) {
  const users = readJson(USERS_FILE, [])
  const e = (email || '').trim().toLowerCase()
  return users.find(u => (u.email || '').trim().toLowerCase() === e)
}

function sanitize(user) {
  const { passwordHash, ...rest } = user
  return rest
}

function register({ name, email, password, role = 'user' }) {
  const users = readJson(USERS_FILE, [])
  if (findByEmail(email)) return { error: 'Email already registered' }
  const passwordHash = bcrypt.hashSync(password, 10)
  const user = { id: uuidv4(), name, email: email.trim(), passwordHash, role }
  users.push(user)
  writeJson(USERS_FILE, users)
  return { user: sanitize(user) }
}

function login({ email, password }) {
  const user = findByEmail(email)
  if (!user) return { error: 'Invalid credentials' }
  const valid = bcrypt.compareSync(password, user.passwordHash)
  if (!valid) return { error: 'Invalid credentials' }
  return { user: sanitize(user) }
}

module.exports = { register, login, sanitize }
