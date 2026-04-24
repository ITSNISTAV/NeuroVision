const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const { sendWelcomeEmail } = require('../config/mailer')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json')

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

async function postLogin(req, res) {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
  const users = loadUsers()
  const user = findByEmail(users, email)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const valid = bcrypt.compareSync(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  sendWelcomeEmail(user.email, user.name).catch(err => console.error('Email failed:', err))

  res.json({ user: safeUser(user) })
}

async function postGoogleAuth(req, res) {
  const { credential } = req.body || {}
  if (!credential) return res.status(400).json({ error: 'Missing Google credential' })

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    const users = loadUsers()
    let user = findByEmail(users, email)

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId
        if (picture && !user.picture) user.picture = picture
        saveUsers(users)
      }
    } else {
      user = {
        id: uuidv4(),
        name,
        email: (email || '').trim().toLowerCase(),
        googleId,
        picture: picture || null,
        role: 'user',
      }
      users.push(user)
      saveUsers(users)
    }

    sendWelcomeEmail(user.email, user.name).catch(err => console.error('Email failed:', err))

    res.json({ user: safeUser(user) })
  } catch (err) {
    console.error('Google OAuth error:', err)
    res.status(401).json({ error: 'Invalid Google token' })
  }
}

module.exports = { postRegister, postLogin, postGoogleAuth }