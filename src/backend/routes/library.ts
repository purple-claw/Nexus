import { Router, Response } from 'express'
import db from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { libraryTree } from '../services/study'

const router = Router()

router.get('/library', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const cats = await libraryTree(db, req.user!.id)
  res.json({ categories: cats })
})

export default router
