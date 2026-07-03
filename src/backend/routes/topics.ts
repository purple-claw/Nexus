import { Router, Response } from 'express'
import db from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { topicDetail } from '../services/study'

function countByTopicId(records: any[]): Record<number, number> {
  const map: Record<number, number> = {}
  for (const r of records) {
    map[r.topic_id] = (map[r.topic_id] || 0) + 1
  }
  return map
}

const router = Router()

router.get('/topics/tracker', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const topics = db.find('topics', { user_id: req.user!.id })
  topics.sort((a: any, b: any) => (b.id || 0) - (a.id || 0))

  const plans = db.find('daily_plans', { user_id: req.user!.id })
  const planMap: Record<number, string> = {}
  for (const p of plans) {
    const tid = p.topic_id
    if (!planMap[tid] || p.plan_date > planMap[tid]) planMap[tid] = p.plan_date
  }

  const readingCount = countByTopicId(db.find('reading_blocks'))
  const mcqCount = countByTopicId(db.find('mcqs'))
  const formulaCount = countByTopicId(db.find('formulas'))
  const noteCount = countByTopicId(db.find('notes'))
  const todoCount = countByTopicId(db.find('todos'))

  const result = topics.map((t: any) => {
    const cat = db.get('categories', t.category_id)
    return {
      id: t.id,
      title: t.title,
      description: t.description || '',
      category_name: cat ? cat.name : '',
      reading_count: readingCount[t.id] || 0,
      mcq_count: mcqCount[t.id] || 0,
      formula_count: formulaCount[t.id] || 0,
      note_count: noteCount[t.id] || 0,
      todo_count: todoCount[t.id] || 0,
      plan_date: planMap[t.id] || null,
    }
  })

  res.json(result)
})

router.get('/topics/:topicId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const topicId = parseInt(req.params.topicId as string)
  const detail = await topicDetail(db, req.user!.id, topicId)
  if (!detail) {
    res.status(404).json({ error: 'Topic not found' })
    return
  }
  res.json(detail)
})

router.put('/topics/:topicId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const topicId = parseInt(req.params.topicId as string)
  const topic = db.findOne('topics', { id: topicId, user_id: req.user!.id })
  if (!topic) {
    res.status(404).json({ error: 'Topic not found' })
    return
  }

  const { title } = req.body
  if (title && title.trim()) {
    await db.update('topics', topicId, { title: title.trim() })
    res.json({ success: true, title: title.trim() })
    return
  }
  res.status(400).json({ error: 'Title is required' })
})

router.delete('/topics/:topicId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const topicId = parseInt(req.params.topicId as string)
    if (!Number.isFinite(topicId)) {
      res.status(400).json({ error: 'Invalid topic ID' })
      return
    }
    const topic = db.findOne('topics', { id: topicId, user_id: req.user!.id })
    if (!topic) {
      res.status(404).json({ error: 'Topic not found' })
      return
    }

    const mcqIds = db.find('mcqs', { topic_id: topicId }).map((m: any) => m.id)
    for (const mid of mcqIds) {
      await db.deleteWhere('progress', { mcq_id: mid, user_id: req.user!.id })
    }
    await db.deleteWhere('mcqs', { topic_id: topicId })
    await db.deleteWhere('reading_blocks', { topic_id: topicId })
    await db.deleteWhere('formulas', { topic_id: topicId })
    await db.deleteWhere('notes', { topic_id: topicId })
    await db.deleteWhere('todos', { topic_id: topicId })
    await db.deleteWhere('daily_plans', { topic_id: topicId })
    await db.deleteWhere('documents', { id: topic.document_id })
    await db.delete('topics', topicId)

    res.json({ success: true })
  } catch (err: any) {
    console.error('Error deleting topic:', err)
    res.status(500).json({ error: 'Failed to delete topic' })
  }
})

export default router
