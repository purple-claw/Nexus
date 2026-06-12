import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { topicDetail } from '../services/study.js'

const router = Router()

router.get('/topics/tracker', authMiddleware, async (req, res) => {
  const topics = db.find('topics', { user_id: req.user.id })
  topics.sort((a, b) => (b.id || 0) - (a.id || 0))

  const plans = db.find('daily_plans', { user_id: req.user.id })
  const planMap = {}
  for (const p of plans) {
    const tid = p.topic_id
    if (!planMap[tid] || p.plan_date > planMap[tid]) planMap[tid] = p.plan_date
  }

  const result = topics.map(t => {
    const cat = db.get('categories', t.category_id)
    return {
      id: t.id,
      title: t.title,
      description: t.description || '',
      category_name: cat ? cat.name : '',
      reading_count: db.count('reading_blocks', { topic_id: t.id }),
      mcq_count: db.count('mcqs', { topic_id: t.id }),
      formula_count: db.count('formulas', { topic_id: t.id }),
      note_count: db.count('notes', { topic_id: t.id }),
      todo_count: db.count('todos', { topic_id: t.id }),
      plan_date: planMap[t.id] || null,
    }
  })

  res.json(result)
})

router.get('/topics/:topicId', authMiddleware, async (req, res) => {
  const topicId = parseInt(req.params.topicId)
  const detail = await topicDetail(db, req.user.id, topicId)
  if (!detail) return res.status(404).json({ error: 'Topic not found' })
  res.json(detail)
})

router.put('/topics/:topicId', authMiddleware, async (req, res) => {
  const topicId = parseInt(req.params.topicId)
  const topic = db.findOne('topics', { id: topicId, user_id: req.user.id })
  if (!topic) return res.status(404).json({ error: 'Topic not found' })

  const { title } = req.body
  if (title && title.trim()) {
    await db.update('topics', topicId, { title: title.trim() })
    return res.json({ success: true, title: title.trim() })
  }
  res.status(400).json({ error: 'Title is required' })
})

router.delete('/topics/:topicId', authMiddleware, async (req, res) => {
  const topicId = parseInt(req.params.topicId)
  const topic = db.findOne('topics', { id: topicId, user_id: req.user.id })
  if (!topic) return res.status(404).json({ error: 'Topic not found' })

  const mcqIds = db.find('mcqs', { topic_id: topicId }).map(m => m.id)
  for (const mid of mcqIds) {
    await db.deleteWhere('progress', { mcq_id: mid, user_id: req.user.id })
  }
  await db.deleteWhere('mcqs', { topic_id: topicId })
  await db.deleteWhere('reading_blocks', { topic_id: topicId })
  await db.deleteWhere('formulas', { topic_id: topicId })
  await db.deleteWhere('notes', { topic_id: topicId })
  await db.deleteWhere('todos', { topic_id: topicId })
  await db.deleteWhere('daily_plans', { topic_id: topicId })
  await db.delete('topics', topicId)

  res.json({ success: true })
})

export default router
