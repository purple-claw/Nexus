import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { libraryTree } from '../services/study.js'

const router = Router()

router.get('/library', authMiddleware, async (req, res) => {
  const cats = await libraryTree(db, req.user.id)
  res.json({ categories: cats })
})

export default router
