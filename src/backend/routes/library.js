const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')
const { libraryTree  } = require('../services/study.js')

const router = Router()

router.get('/library', authMiddleware, async (req, res) => {
  const cats = await libraryTree(db, req.user.id)
  res.json({ categories: cats })
})

module.exports = router
