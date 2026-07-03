const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')
const { dailyPlan  } = require('../services/study.js')

const router = Router()

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

router.get('/daily/:dateStr', authMiddleware, async (req, res) => {
  if (!DATE_REGEX.test(req.params.dateStr)) {
    return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' })
  }
  const result = await dailyPlan(db, req.user.id, req.params.dateStr)
  res.json(result)
})

module.exports = router
