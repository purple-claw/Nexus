const { Router  } = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('../db.js')
const config = require('../config.js')
const { generateToken, authMiddleware  } = require('../middleware/auth.js')

const router = Router()

router.get('/auth/me', (req, res) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.json({ user: null })
  }
  try {
    const token = header.split(' ')[1]
    const user = jwt.verify(token, config.jwtSecret)
    return res.json({ user: { id: user.id, username: user.username, email: user.email } })
  } catch {
    return res.json({ user: null })
  }
})

router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const errors = []
    if (!username || username.trim().length < 3) errors.push('Username must be at least 3 characters')
    if (!email || !email.includes('@')) errors.push('Enter a valid email address')
    if (!password || password.length < 6) errors.push('Password must be at least 6 characters')

    if (errors.length === 0 && db.findOne('users', { username: username.trim() })) errors.push('Username already taken')
    if (errors.length === 0 && db.findOne('users', { email: email.trim() })) errors.push('Email already registered')

    if (errors.length > 0) return res.status(400).json({ error: errors[0] })

    const hash = await bcrypt.hash(password, 10)
    const userId = await db.insert('users', {
      username: username.trim(),
      email: email.trim(),
      password_hash: hash,
    })
    const user = db.get('users', userId)
    const token = generateToken(user)
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = db.findOne('users', { username: username.trim() })
    if (!user) return res.status(401).json({ error: 'Invalid username or password' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' })

    const token = generateToken(user)
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/auth/logout', authMiddleware, (req, res) => {
  res.json({ success: true })
})

module.exports = router
