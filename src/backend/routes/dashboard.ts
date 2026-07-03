import { Router, Response } from 'express'
import db from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { dashboardSummary } from '../services/study'

const router = Router()

router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date().toISOString().split('T')[0]
  const summary = await dashboardSummary(db, req.user!.id, today)
  res.json(summary)
})

export default router
