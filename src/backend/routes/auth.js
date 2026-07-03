const { Router } = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')
const db = require('../db.js')
const config = require('../config.js')
const { generateToken, authMiddleware, invalidateToken } = require('../middleware/auth.js')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const router = Router()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.get('/auth/me', (req, res) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    const token = header.split(' ')[1]
    const user = jwt.verify(token, config.jwtSecret)
    return res.json({ user: { id: user.id, username: user.username, email: user.email } })
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
})

router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const errors = []
    const trimmedUsername = (username || '').trim()
    const trimmedEmail = (email || '').trim().toLowerCase()
    const trimmedPassword = password || ''

    if (trimmedUsername.length < 3) errors.push('Username must be at least 3 characters')
    if (trimmedUsername.length > 30) errors.push('Username must be at most 30 characters')
    if (!EMAIL_REGEX.test(trimmedEmail)) errors.push('Enter a valid email address')
    if (trimmedPassword.length < 6) errors.push('Password must be at least 6 characters')

    if (errors.length === 0 && db.findOne('users', { username: trimmedUsername })) errors.push('Username already taken')
    if (errors.length === 0 && db.findOne('users', { email: trimmedEmail })) errors.push('Email already registered')

    if (errors.length > 0) return res.status(400).json({ error: errors[0] })

    const hash = await bcrypt.hash(trimmedPassword, 10)
    const userId = await db.insert('users', {
      username: trimmedUsername,
      email: trimmedEmail,
      password_hash: hash,
    })
    const user = db.get('users', userId)
    const token = generateToken(user)
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token })
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
})

router.post('/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body
    const trimmedUsername = (username || '').trim()
    const trimmedPassword = password || ''

    const user = db.findOne('users', { username: trimmedUsername }) || db.findOne('users', { email: trimmedUsername.toLowerCase() })
    if (!user) return res.status(401).json({ error: 'Invalid username or password' })

    const valid = await bcrypt.compare(trimmedPassword, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' })

    const token = generateToken(user)
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
})

router.post('/auth/logout', authMiddleware, (req, res) => {
  const header = req.headers.authorization
  const token = header.split(' ')[1]
  invalidateToken(token)
  res.json({ success: true, message: 'Logged out successfully' })
})

module.exports = router
