const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')
const { listMcqs  } = require('../services/study.js')

const router = Router()

router.get('/mcqs', authMiddleware, async (req, res) => {
  const result = await listMcqs(db, req.user.id)
  res.json(result)
})

router.post('/mcqs/:mcqId/answer', authMiddleware, async (req, res) => {
  const mcqId = parseInt(req.params.mcqId)
  const { is_correct } = req.body
  const correct = !!is_correct

  const mcq = db.get('mcqs', mcqId)
  if (!mcq) return res.status(404).json({ error: 'Question not found' })
  const topic = db.get('topics', mcq.topic_id)
  if (!topic || topic.user_id !== req.user.id) return res.status(404).json({ error: 'Question not found' })

  const existing = db.findOne('progress', { user_id: req.user.id, mcq_id: mcqId })
  if (existing) {
    await db.update('progress', existing.id, {
      attempts: (existing.attempts || 0) + 1,
      correct_count: (existing.correct_count || 0) + (correct ? 1 : 0),
    })
  } else {
    await db.insert('progress', {
      user_id: req.user.id,
      mcq_id: mcqId,
      attempts: 1,
      correct_count: correct ? 1 : 0,
    })
  }

  res.json({ success: true })
})

module.exports = router
