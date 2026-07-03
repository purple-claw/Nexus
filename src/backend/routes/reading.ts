import { Router, Response } from 'express'
import db from '../db'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

function getTopicIdsAndTitles(userId: number): { topicIds: number[]; topicTitles: Record<number, string> } {
  const today = new Date().toISOString().slice(0, 10)
  const plans = db.find('daily_plans', { user_id: userId, plan_date: today })
  let topicIds: number[]
  if (plans.length === 0) {
    const allTopics = db.find('topics', { user_id: userId })
    topicIds = allTopics.map((t: any) => t.id)
  } else {
    topicIds = plans.map(p => p.topic_id).filter(Boolean)
  }
  const topicTitles: Record<number, string> = {}
  for (const tid of topicIds) {
    const t = db.get('topics', tid)
    if (t) topicTitles[tid] = t.title
  }
  return { topicIds, topicTitles }
}

function groupByTopicId(records: any[]): Record<number, any[]> {
  const map: Record<number, any[]> = {}
  for (const r of records) {
    if (!map[r.topic_id]) map[r.topic_id] = []
    map[r.topic_id].push(r)
  }
  return map
}

router.get('/reading', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { topicIds, topicTitles } = getTopicIdsAndTitles(req.user!.id)
  const blocksByTopic = groupByTopicId(db.find('reading_blocks'))
  const result: any[] = []
  for (const tid of topicIds) {
    const blocks = blocksByTopic[tid] || []
    const topicTitle = topicTitles[tid] || ''
    for (const rb of blocks) {
      result.push({
        id: rb.id,
        title: rb.title || '',
        topic_title: topicTitle,
        content: rb.content || '',
        topic_id: tid,
      })
    }
  }
  result.sort((a, b) => (a.topic_title || '').localeCompare(b.topic_title || ''))
  res.json(result)
})

router.get('/reading/formulas', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { topicIds, topicTitles } = getTopicIdsAndTitles(req.user!.id)
  const formulasByTopic = groupByTopicId(db.find('formulas'))
  const result: any[] = []
  for (const tid of topicIds) {
    const formulas = formulasByTopic[tid] || []
    const topicTitle = topicTitles[tid] || ''
    for (const f of formulas) {
      result.push({
        id: f.id,
        title: f.title || '',
        content: f.content || '',
        topic_title: topicTitle,
        topic_id: tid,
      })
    }
  }
  result.sort((a, b) => (a.topic_title || '').localeCompare(b.topic_title || ''))
  res.json(result)
})

router.get('/reading/notes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { topicIds, topicTitles } = getTopicIdsAndTitles(req.user!.id)
  const notesByTopic = groupByTopicId(db.find('notes'))
  const result: any[] = []
  for (const tid of topicIds) {
    const noteList = notesByTopic[tid] || []
    const topicTitle = topicTitles[tid] || ''
    for (const n of noteList) {
      result.push({
        id: n.id,
        content: n.content || '',
        topic_title: topicTitle,
        topic_id: tid,
      })
    }
  }
  result.sort((a, b) => (a.topic_title || '').localeCompare(b.topic_title || ''))
  res.json(result)
})

router.get('/reading/code', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { topicIds, topicTitles } = getTopicIdsAndTitles(req.user!.id)
  const blocksByTopic = groupByTopicId(db.find('reading_blocks'))
  const result: any[] = []
  let snippetIdCounter = 0
  const codeRegex = /```(\w+)\s*\n([\s\S]*?)```/g
  for (const tid of topicIds) {
    const blocks = blocksByTopic[tid] || []
    const topicTitle = topicTitles[tid] || ''
    for (const rb of blocks) {
      const content = rb.content || ''
      let match: RegExpExecArray | null
      while ((match = codeRegex.exec(content)) !== null) {
        const language = match[1]
        const code = match[2].trim()
        if (code.split(/\s+/).length >= 3) {
          snippetIdCounter++
          result.push({
            id: snippetIdCounter,
            title: rb.title || '',
            language,
            content: code,
            topic_title: topicTitle,
            topic_id: tid,
          })
        }
      }
    }
  }
  result.sort((a, b) => (a.topic_title || '').localeCompare(b.topic_title || ''))
  res.json(result)
})

router.get('/reading/formula/:formulaId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const formulaId = parseInt(req.params.formulaId as string)
  const f = db.get('formulas', formulaId)
  if (!f) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const topic = db.get('topics', f.topic_id)
  if (!topic || topic.user_id !== req.user!.id) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json({
    id: f.id,
    title: f.title || '',
    content: f.content || '',
    topic_title: topic.title,
    topic_id: topic.id,
  })
})

router.get('/reading/note/:noteId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const noteId = parseInt(req.params.noteId as string)
  const n = db.get('notes', noteId)
  if (!n) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const topic = db.get('topics', n.topic_id)
  if (!topic || topic.user_id !== req.user!.id) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json({
    id: n.id,
    content: n.content || '',
    topic_title: topic.title,
    topic_id: topic.id,
  })
})

router.get('/reading/:textId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const textId = parseInt(req.params.textId as string)
  const rb = db.get('reading_blocks', textId)
  if (!rb) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const topic = db.get('topics', rb.topic_id)
  if (!topic || topic.user_id !== req.user!.id) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json({
    title: rb.title || '',
    topic_title: topic.title,
    content: rb.content || '',
  })
})

export default router
