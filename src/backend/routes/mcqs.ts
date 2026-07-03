import { Router, Response } from 'express'
import db from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { parseOptions } from '../services/study'

const router = Router()

router.get('/mcqs', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10)
  const plans = db.find('daily_plans', { user_id: req.user!.id, plan_date: today })
  let topicIds: number[] = plans.map(p => p.topic_id).filter(Boolean)
  if (topicIds.length === 0) {
    const allTopics = db.find('topics', { user_id: req.user!.id })
    topicIds = allTopics.map((t: any) => t.id)
  }
  const topicTitles: Record<number, string> = {}
  for (const tid of topicIds) {
    const t = db.get('topics', tid)
    if (t) topicTitles[tid] = t.title
  }
  const allMcqs = topicIds.length > 0 ? db.find('mcqs').filter((m: any) => topicIds.includes(m.topic_id)) : []
  const progressRecords = db.find('progress', { user_id: req.user!.id })
  const progressByMcq: Record<number, any> = {}
  for (const p of progressRecords) {
    progressByMcq[p.mcq_id] = p
  }
  const result = allMcqs.map((m: any) => {
    const p = progressByMcq[m.id]
    return {
      id: m.id,
      topic_title: topicTitles[m.topic_id] || '',
      question: m.question,
      options: parseOptions(m.options || '[]'),
      explanation: m.explanation || '',
      difficulty: m.difficulty || 'medium',
      attempts: p ? p.attempts || 0 : 0,
      correct_count: p ? p.correct_count || 0 : 0,
    }
  })
  res.json(result)
})

router.post('/mcqs/:mcqId/answer', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const mcqId = parseInt(req.params.mcqId as string, 10)
  if (isNaN(mcqId)) {
    res.status(400).json({ error: 'Invalid MCQ ID' })
    return
  }
  const { is_correct } = req.body
  if (typeof is_correct !== 'boolean') {
    res.status(400).json({ error: 'is_correct must be a boolean' })
    return
  }

  const mcq = db.get('mcqs', mcqId)
  if (!mcq) {
    res.status(404).json({ error: 'Question not found' })
    return
  }
  const topic = db.get('topics', mcq.topic_id)
  if (!topic || topic.user_id !== req.user!.id) {
    res.status(404).json({ error: 'Question not found' })
    return
  }

  const existing = db.findOne('progress', { user_id: req.user!.id, mcq_id: mcqId })
  if (existing) {
    await db.update('progress', existing.id, {
      attempts: (existing.attempts || 0) + 1,
      correct_count: (existing.correct_count || 0) + (is_correct ? 1 : 0),
    })
  } else {
    await db.insert('progress', {
      user_id: req.user!.id,
      mcq_id: mcqId,
      attempts: 1,
      correct_count: is_correct ? 1 : 0,
    })
  }

  res.json({ success: true, correct: is_correct, correctAnswer: mcq.answer })
})

export default router
