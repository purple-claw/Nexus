import { Router, Response } from 'express'
import db from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/todos', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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
  const todosByTopic: Record<number, any[]> = {}
  for (const todo of db.find('todos')) {
    if (topicIds.includes(todo.topic_id)) {
      if (!todosByTopic[todo.topic_id]) todosByTopic[todo.topic_id] = []
      todosByTopic[todo.topic_id].push(todo)
    }
  }
  const groups: any[] = []
  for (const tid of topicIds) {
    const topicTodos = todosByTopic[tid]
    if (topicTodos && topicTodos.length > 0) {
      topicTodos.sort((a: any, b: any) => (a.order_idx || 0) - (b.order_idx || 0))
      groups.push({
        topic: topicTitles[tid] || '',
        topic_id: tid,
        todos: topicTodos.map((t: any) => ({ ...t, is_completed: t.is_completed === 1 })),
      })
    }
  }
  res.json({ groups })
})

router.post('/todos/:todoId/toggle', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const todoId = parseInt(req.params.todoId as string)
  const todo = db.get('todos', todoId)
  if (!todo) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (todo.topic_id) {
    const topic = db.get('topics', todo.topic_id)
    if (!topic || topic.user_id !== req.user!.id) {
      res.status(404).json({ error: 'Not found' })
      return
    }
  }
  const newStatus = todo.is_completed ? 0 : 1
  await db.update('todos', todoId, { is_completed: newStatus })
  res.json({ success: true, is_completed: newStatus === 1 })
})

export default router
