import { Router, Response } from 'express'
import db from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/calendar/events', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const plans = db.find('daily_plans', { user_id: req.user!.id })
  const events: Record<string, { topics: number }> = {}
  for (const p of plans) {
    if (!events[p.plan_date]) events[p.plan_date] = { topics: 0 }
    events[p.plan_date].topics += 1
  }
  res.json(events)
})

router.get('/calendar/available', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const topics = db.find('topics', { user_id: req.user!.id })
  topics.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''))
  res.json({ topics: topics.slice(0, 100).map((t: any) => ({ id: t.id, title: t.title })) })
})

function resolveTopicIds(body: any, _userId: number): number[] {
  if (body.topic_ids && Array.isArray(body.topic_ids)) {
    return body.topic_ids
      .map((id: any) => parseInt(id))
      .filter((id: number) => Number.isFinite(id))
  }
  const singleId = parseInt(body.topic_id)
  if (Number.isFinite(singleId)) return [singleId]
  return []
}

router.post('/calendar/assign', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { date } = req.body
  const topicIds = resolveTopicIds(req.body, req.user!.id)

  if (topicIds.length === 0) {
    res.status(400).json({ error: 'At least one valid topic ID is required' })
    return
  }

  for (const topicId of topicIds) {
    const topic = db.get('topics', topicId)
    if (!topic || topic.user_id !== req.user!.id) {
      res.status(404).json({ error: `Topic ${topicId} not found` })
      return
    }
  }

  if (!date) {
    for (const topicId of topicIds) {
      await db.deleteWhere('daily_plans', { user_id: req.user!.id, topic_id: topicId })
    }
    res.json({ success: true, cleared: true })
    return
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'A valid YYYY-MM-DD date is required' })
    return
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const planDate = new Date(date + 'T00:00:00')
  if (planDate < today) {
    res.status(400).json({ error: 'Cannot assign topics to past dates' })
    return
  }

  for (const topicId of topicIds) {
    const existing = db.findOne('daily_plans', { user_id: req.user!.id, plan_date: date, topic_id: topicId })
    if (!existing) {
      await db.insert('daily_plans', { user_id: req.user!.id, plan_date: date, topic_id: topicId })
    }
  }

  res.json({ success: true, assigned_count: topicIds.length })
})

export default router
