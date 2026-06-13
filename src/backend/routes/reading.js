const { Router  } = require('express')
const db = require('../db.js')
const { authMiddleware  } = require('../middleware/auth.js')

const router = Router()

function getTopicIdsForToday(userId) {
  const today = new Date().toISOString().slice(0, 10)
  const plans = db.find('daily_plans', { user_id: userId, plan_date: today })
  if (plans.length === 0) {
    const allTopics = db.find('topics', { user_id: userId })
    return allTopics.map(t => t.id)
  }
  return plans.map(p => p.topic_id).filter(Boolean)
}

router.get('/reading', authMiddleware, async (req, res) => {
  const topicIds = getTopicIdsForToday(req.user.id)
  const result = []
  for (const tid of topicIds) {
    for (const rb of db.find('reading_blocks', { topic_id: tid })) {
      const topic = db.get('topics', tid)
      result.push({
        id: rb.id,
        title: rb.title || '',
        topic_title: topic ? topic.title : '',
        content: rb.content || '',
        topic_id: tid,
      })
    }
  }
  result.sort((a, b) => (a.topic_title || '').localeCompare(b.topic_title || ''))
  res.json(result)
})

router.get('/reading/formulas', authMiddleware, async (req, res) => {
  const topicIds = getTopicIdsForToday(req.user.id)
  const result = []
  for (const tid of topicIds) {
    const topic = db.get('topics', tid)
    for (const f of db.find('formulas', { topic_id: tid })) {
      result.push({
        id: f.id,
        title: f.title || '',
        content: f.content || '',
        topic_title: topic ? topic.title : '',
        topic_id: tid,
      })
    }
  }
  result.sort((a, b) => (a.topic_title || '').localeCompare(b.topic_title || ''))
  res.json(result)
})

router.get('/reading/notes', authMiddleware, async (req, res) => {
  const topicIds = getTopicIdsForToday(req.user.id)
  const result = []
  for (const tid of topicIds) {
    const topic = db.get('topics', tid)
    for (const n of db.find('notes', { topic_id: tid })) {
      result.push({
        id: n.id,
        content: n.content || '',
        topic_title: topic ? topic.title : '',
        topic_id: tid,
      })
    }
  }
  result.sort((a, b) => (a.topic_title || '').localeCompare(b.topic_title || ''))
  res.json(result)
})

router.get('/reading/code', authMiddleware, async (req, res) => {
  const topicIds = getTopicIdsForToday(req.user.id)
  const result = []
  const codeRegex = /```(\w+)\s*\n([\s\S]*?)```/g
  for (const tid of topicIds) {
    const topic = db.get('topics', tid)
    const readingBlocks = db.find('reading_blocks', { topic_id: tid })
    for (const rb of readingBlocks) {
      const content = rb.content || ''
      let match
      while ((match = codeRegex.exec(content)) !== null) {
        const language = match[1]
        const code = match[2].trim()
        if (code.split(/\s+/).length >= 3) {
          result.push({
            id: `${rb.id}-${result.length}`,
            title: rb.title || '',
            language,
            content: code,
            topic_title: topic ? topic.title : '',
            topic_id: tid,
          })
        }
      }
    }
  }
  result.sort((a, b) => (a.topic_title || '').localeCompare(b.topic_title || ''))
  res.json(result)
})

router.get('/reading/formula/:formulaId', authMiddleware, async (req, res) => {
  const formulaId = parseInt(req.params.formulaId)
  const f = db.get('formulas', formulaId)
  if (!f) return res.status(404).json({ error: 'Not found' })
  const topic = db.get('topics', f.topic_id)
  if (!topic || topic.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' })
  res.json({
    id: f.id,
    title: f.title || '',
    content: f.content || '',
    topic_title: topic.title,
    topic_id: topic.id,
  })
})

router.get('/reading/note/:noteId', authMiddleware, async (req, res) => {
  const noteId = parseInt(req.params.noteId)
  const n = db.get('notes', noteId)
  if (!n) return res.status(404).json({ error: 'Not found' })
  const topic = db.get('topics', n.topic_id)
  if (!topic || topic.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' })
  res.json({
    id: n.id,
    content: n.content || '',
    topic_title: topic.title,
    topic_id: topic.id,
  })
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

module.exports = router
