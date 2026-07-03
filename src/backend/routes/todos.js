const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')

const router = Router()

router.get('/todos', authMiddleware, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const plans = db.find('daily_plans', { user_id: req.user.id, plan_date: today })
  let topicIds = plans.map(p => p.topic_id).filter(Boolean)
  if (topicIds.length === 0) {
    const allTopics = db.find('topics', { user_id: req.user.id })
    topicIds = allTopics.map(t => t.id)
  }
  const topicTitles = {}
  for (const tid of topicIds) {
    const t = db.get('topics', tid)
    if (t) topicTitles[tid] = t.title
  }
  const todosByTopic = {}
  for (const todo of db.find('todos')) {
    if (topicIds.includes(todo.topic_id)) {
      if (!todosByTopic[todo.topic_id]) todosByTopic[todo.topic_id] = []
      todosByTopic[todo.topic_id].push(todo)
    }
  }
  const groups = []
  for (const tid of topicIds) {
    const topicTodos = todosByTopic[tid]
    if (topicTodos && topicTodos.length > 0) {
      topicTodos.sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0))
      groups.push({
        topic: topicTitles[tid] || '',
        topic_id: tid,
        todos: topicTodos.map(t => ({ ...t, is_completed: t.is_completed === 1 })),
      })
    }
  }
  res.json({ groups })
})

router.post('/todos/:todoId/toggle', authMiddleware, async (req, res) => {
  const todoId = parseInt(req.params.todoId)
  const todo = db.get('todos', todoId)
  if (!todo) return res.status(404).json({ error: 'Not found' })
  if (todo.topic_id) {
    const topic = db.get('topics', todo.topic_id)
    if (!topic || topic.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' })
  }
  const newStatus = todo.is_completed ? 0 : 1
  await db.update('todos', todoId, { is_completed: newStatus })
  res.json({ success: true, is_completed: newStatus === 1 })
})

module.exports = router
