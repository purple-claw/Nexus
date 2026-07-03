import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'

interface AuthRequest extends Request {
  user?: { id: number; username: string; email: string }
}

const tokenBlacklist = new Set<string>()

function generateToken(user: { id: number; username: string; email: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  )
}

function invalidateToken(token: string): void {
  tokenBlacklist.add(token)
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  try {
    const token = header.split(' ')[1]
    if (tokenBlacklist.has(token)) {
      res.status(401).json({ error: 'Token has been invalidated' })
      return
    }
    req.user = jwt.verify(token, config.jwtSecret) as { id: number; username: string; email: string }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export { generateToken, authMiddleware, invalidateToken, tokenBlacklist }
export type { AuthRequest }
