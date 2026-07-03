import { Router, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import db from '../db'
import { config } from '../config'
import { generateToken, authMiddleware, invalidateToken, AuthRequest } from '../middleware/auth'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const router = Router()

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.get('/auth/me', (req: AuthRequest, res: Response): void => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  try {
    const token = header.split(' ')[1]
    const user = jwt.verify(token, config.jwtSecret) as { id: number; username: string; email: string }
    res.json({ user: { id: user.id, username: user.username, email: user.email } })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

router.post('/auth/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body
    const errors: string[] = []
    const trimmedUsername = (username || '').trim()
    const trimmedEmail = (email || '').trim().toLowerCase()
    const trimmedPassword = password || ''

    if (trimmedUsername.length < 3) errors.push('Username must be at least 3 characters')
    if (trimmedUsername.length > 30) errors.push('Username must be at most 30 characters')
    if (!EMAIL_REGEX.test(trimmedEmail)) errors.push('Enter a valid email address')
    if (trimmedPassword.length < 6) errors.push('Password must be at least 6 characters')

    if (errors.length === 0 && db.findOne('users', { username: trimmedUsername })) errors.push('Username already taken')
    if (errors.length === 0 && db.findOne('users', { email: trimmedEmail })) errors.push('Email already registered')

    if (errors.length > 0) {
      res.status(400).json({ error: errors[0] })
      return
    }

    const hash = await bcrypt.hash(trimmedPassword, 10)
    const userId = await db.insert('users', {
      username: trimmedUsername,
      email: trimmedEmail,
      password_hash: hash,
    })
    const user = db.get('users', userId)
    const token = generateToken(user)
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token })
  } catch (err: any) {
    console.error('Register error:', err.message)
    res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
})

router.post('/auth/login', loginLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    const trimmedUsername = (username || '').trim()
    const trimmedPassword = password || ''

    const user = db.findOne('users', { username: trimmedUsername }) || db.findOne('users', { email: trimmedUsername.toLowerCase() })
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' })
      return
    }

    const valid = await bcrypt.compare(trimmedPassword, user.password_hash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' })
      return
    }

    const token = generateToken(user)
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token })
  } catch (err: any) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
})

router.post('/auth/logout', authMiddleware, (req: AuthRequest, res: Response): void => {
  const header = req.headers.authorization!
  const token = header.split(' ')[1]
  invalidateToken(token)
  res.json({ success: true, message: 'Logged out successfully' })
})

export default router
