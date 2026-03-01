const { register, login } = require('../services/userService')


function postRegister(req, res) {
  const { name, email, password, role } = req.body || {}
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' })
  const result = register({ name, email, password, role })
  if (result.error) return res.status(400).json({ error: result.error })
  res.json(result)
}

function postLogin(req, res) {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
  const result = login({ email, password })
  if (result.error) return res.status(401).json({ error: result.error })
  res.json(result)
}

module.exports = { postRegister, postLogin }
