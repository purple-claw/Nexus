import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { dailyPlan } from '../services/study.js'

const router = Router()

router.get('/daily/:dateStr', authMiddleware, async (req, res) => {
  const result = await dailyPlan(db, req.user.id, req.params.dateStr)
  res.json(result)
})

export default router
