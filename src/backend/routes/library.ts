import { Router, Response } from 'express'
import db from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { libraryTree } from '../services/study'

const router = Router()

router.get('/library', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const cats = await libraryTree(db, req.user!.id)
  res.json({ categories: cats })
})

router.get('/categories', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const cats = db.find('categories', { user_id: req.user!.id })
  const result = cats.map((c: any) => ({ id: c.id, name: c.name, parent_id: c.parent_id || null }))
  result.sort((a: any, b: any) => a.name.localeCompare(b.name))
  res.json(result)
})

export default router
