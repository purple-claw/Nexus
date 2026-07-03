import { Router, Response } from 'express'
import db from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { dailyPlan } from '../services/study'

const router = Router()

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

router.get('/daily/:dateStr', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const dateStr = req.params.dateStr as string
  if (!DATE_REGEX.test(dateStr)) {
    res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' })
    return
  }
  const result = await dailyPlan(db, req.user!.id, dateStr)
  res.json(result)
})

export default router
