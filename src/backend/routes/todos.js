const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')

const router = Router()

router.get('/todos', authMiddleware, async (req, res) => {
  const topics = db.find('topics', { user_id: req.user.id })
  const groups = []
  for (const t of topics) {
    const topicTodos = db.find('todos', { topic_id: t.id })
    if (topicTodos.length > 0) {
      topicTodos.sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0))
      groups.push({ topic: t.title, todos: topicTodos })
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
  res.json({ success: true, is_completed: !!newStatus })
})

module.exports = router
