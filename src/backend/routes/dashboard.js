const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')
const { dashboardSummary  } = require('../services/study.js')

const router = Router()

router.get('/dashboard', authMiddleware, async (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const summary = await dashboardSummary(db, req.user.id, today)
  res.json(summary)
})

module.exports = router
