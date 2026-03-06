const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')
const USERS_FILE = path.join(__dirname,  '..', 'data', 'users.json')

function ensureStore() {
  const dir = path.dirname(USERS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf-8')
}

function loadUsers() {
  ensureStore()
  const raw = fs.readFileSync(USERS_FILE, 'utf-8') || '[]'
  return JSON.parse(raw)
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

function findByEmail(users, email) {
  const e = (email || '').trim().toLowerCase()
  return users.find(u => (u.email || '').trim().toLowerCase() === e)
}

function safeUser(user) {
  const { passwordHash, ...rest } = user
  return rest
}

function postRegister(req, res) {
  const { name, email, password, role } = req.body || {}
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' })
  const users = loadUsers()
  const exists = findByEmail(users, email)
  if (exists) return res.status(400).json({ error: 'Email already registered' })
  const passwordHash = bcrypt.hashSync(password, 10)
  const user = { id: uuidv4(), name, email: (email || '').trim(), passwordHash, role: role || 'user' }
  users.push(user)
  saveUsers(users)
  res.json({ user: safeUser(user) })
}

function postLogin(req, res) {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
  const users = loadUsers()
  const user = findByEmail(users, email)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const valid = bcrypt.compareSync(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
  res.json({ user: safeUser(user) })
}

module.exports = { postRegister, postLogin }
