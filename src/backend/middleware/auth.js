const jwt = require('jsonwebtoken')
const config = require('../config.js')

const tokenBlacklist = new Set()

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  )
}

function invalidateToken(token) {
  tokenBlacklist.add(token)
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    const token = header.split(' ')[1]
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ error: 'Token has been invalidated' })
    }
    req.user = jwt.verify(token, config.jwtSecret)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { generateToken, authMiddleware, invalidateToken, tokenBlacklist }
