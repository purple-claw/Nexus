const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')

const router = Router()

router.get('/calendar/events', authMiddleware, async (req, res) => {
  const plans = db.find('daily_plans', { user_id: req.user.id })
  const events = {}
  for (const p of plans) {
    if (!events[p.plan_date]) events[p.plan_date] = { topics: 0 }
    events[p.plan_date].topics += 1
  }
  res.json(events)
})

router.get('/calendar/available', authMiddleware, async (req, res) => {
  const topics = db.find('topics', { user_id: req.user.id })
  topics.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
  res.json({ topics: topics.slice(0, 100).map(t => ({ id: t.id, title: t.title })) })
})

router.post('/calendar/assign', authMiddleware, async (req, res) => {
  const { topic_id, date } = req.body
  const topicId = parseInt(topic_id)

  if (isNaN(topicId)) return res.status(400).json({ error: 'A valid topic ID is required' })

  const topic = db.get('topics', topicId)
  if (!topic || topic.user_id !== req.user.id) return res.status(404).json({ error: 'Topic not found' })

  if (!date) {
    await db.deleteWhere('daily_plans', { user_id: req.user.id, topic_id: topicId })
    return res.json({ success: true, cleared: true })
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'A valid YYYY-MM-DD date is required' })
  }

  const existing = db.findOne('daily_plans', { user_id: req.user.id, plan_date: date, topic_id: topicId })
  if (!existing) {
    await db.insert('daily_plans', { user_id: req.user.id, plan_date: date, topic_id: topicId })
  }

  res.json({ success: true })
})

module.exports = router
