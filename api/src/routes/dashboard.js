import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { dashboardSummary } from '../services/study.js'

const router = Router()

router.get('/dashboard', authMiddleware, async (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const summary = await dashboardSummary(db, req.user.id, today)
  res.json(summary)
})

export default router
