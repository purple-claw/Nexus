const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')
const { dailyPlan  } = require('../services/study.js')

const router = Router()

router.get('/daily/:dateStr', authMiddleware, async (req, res) => {
  const result = await dailyPlan(db, req.user.id, req.params.dateStr)
  res.json(result)
})

module.exports = router
