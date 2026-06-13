const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')
const { listMcqs  } = require('../services/study.js')

function parseOptions(value) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const router = Router()

router.get('/mcqs', authMiddleware, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const plans = db.find('daily_plans', { user_id: req.user.id, plan_date: today })
  let topicIds = plans.map(p => p.topic_id).filter(Boolean)
  if (topicIds.length === 0) {
    const allTopics = db.find('topics', { user_id: req.user.id })
    topicIds = allTopics.map(t => t.id)
  }
  const result = []
  for (const tid of topicIds) {
    const t = db.get('topics', tid)
    if (!t) continue
    for (const m of db.find('mcqs', { topic_id: t.id })) {
      const p = db.findOne('progress', { user_id: req.user.id, mcq_id: m.id })
      result.push({
        id: m.id,
        topic_title: t.title,
        question: m.question,
        options: parseOptions(m.options || '[]'),
        answer: m.answer,
        explanation: m.explanation || '',
        difficulty: m.difficulty || 'medium',
        attempts: p ? p.attempts || 0 : 0,
        correct_count: p ? p.correct_count || 0 : 0,
      })
    }
  }
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
