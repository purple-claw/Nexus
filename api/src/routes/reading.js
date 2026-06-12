import { Router } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/reading', authMiddleware, async (req, res) => {
  const topics = db.find('topics', { user_id: req.user.id })
  const result = []
  for (const t of topics) {
    for (const rb of db.find('reading_blocks', { topic_id: t.id })) {
      result.push({
        id: rb.id,
        title: rb.title || '',
        topic_title: t.title,
        content: rb.content || '',
      })
    }
  }
  res.json(result)
})

router.get('/reading/:textId', authMiddleware, async (req, res) => {
  const textId = parseInt(req.params.textId)
  const rb = db.get('reading_blocks', textId)
  if (!rb) return res.status(404).json({ error: 'Not found' })
  const topic = db.get('topics', rb.topic_id)
  if (!topic || topic.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' })
  res.json({
    title: rb.title || '',
    topic_title: topic.title,
    content: rb.content || '',
  })
})

export default router
