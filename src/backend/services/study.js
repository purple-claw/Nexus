const { getOrCreateCategory  } = require('../parser.js')

function parseOptions(value) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function dashboardSummary(db, userId, today) {
  const plans = db.find('daily_plans', { user_id: userId, plan_date: today })
  let topicIds = plans.map(p => p.topic_id).filter(Boolean)

  if (topicIds.length === 0) {
    const allTopics = db.find('topics', { user_id: userId })
    allTopics.sort((a, b) => (b.id || 0) - (a.id || 0))
    topicIds = allTopics.slice(0, 5).map(t => t.id)
  }

  const topics = []
  for (const plan of plans) {
    const t = db.get('topics', plan.topic_id)
    if (t) {
      const cat = db.get('categories', t.category_id)
      topics.push({
        id: t.id,
        title: t.title,
        description: t.description || '',
        category_name: cat ? cat.name : '',
      })
    }
  }
  if (topics.length === 0) {
    for (const tid of topicIds) {
      const t = db.get('topics', tid)
      if (t) {
        const cat = db.get('categories', t.category_id)
        topics.push({
          id: t.id,
          title: t.title,
          description: t.description || '',
          category_name: cat ? cat.name : '',
        })
      }
    }
  }

  const reading = []
  const mcqs = []
  const todos = []

  const topicSet = new Set(topicIds)
  const allReadingBlocks = db.find('reading_blocks')
  const allMcqs = db.find('mcqs')
  const allTodos = db.find('todos')

  for (const r of allReadingBlocks) {
    if (topicSet.has(r.topic_id)) reading.push(r)
  }
  for (const m of allMcqs) {
    if (topicSet.has(m.topic_id)) {
      const mCopy = { ...m }
      mCopy.options = parseOptions(m.options || '[]')
      delete mCopy.answer
      mcqs.push(mCopy)
    }
  }
  for (const td of allTodos) {
    if (topicSet.has(td.topic_id)) todos.push(td)
  }

  const pendingTodos = todos.filter(t => !t.is_completed).length

  const progressRecords = db.find('progress', { user_id: userId })
  const progressByMcq = {}
  for (const p of progressRecords) {
    progressByMcq[p.mcq_id] = p
  }

  let mcqAttempts = 0
  let mcqCorrect = 0
  for (const m of mcqs) {
    const p = progressByMcq[m.id]
    if (p) {
      mcqAttempts += p.attempts || 0
      mcqCorrect += p.correct_count || 0
    }
  }
  const accuracy = mcqAttempts > 0 ? Math.round((mcqCorrect / mcqAttempts) * 100) : null

  const userTopicIds = new Set(db.find('topics', { user_id: userId }).map(t => t.id))
  let totalReading = 0
  let totalMcqs = 0
  let totalTodos = 0
  for (const r of allReadingBlocks) { if (userTopicIds.has(r.topic_id)) totalReading++ }
  for (const m of allMcqs) { if (userTopicIds.has(m.topic_id)) totalMcqs++ }
  for (const td of allTodos) { if (userTopicIds.has(td.topic_id) && !td.is_completed) totalTodos++ }
  totalTodos = totalTodos || pendingTodos

  const stats = {
    topic_count: userTopicIds.size,
    mcq_count: totalMcqs,
    reading_count: totalReading,
    pending_todos: totalTodos,
    attempts: mcqAttempts,
    correct_count: mcqCorrect,
    accuracy,
  }

  return { stats, topics, reading, mcqs, todos }
}

async function libraryTree(db, userId) {
  const cats = db.find('categories', { user_id: userId })

  const byId = {}
  for (const c of cats) {
    byId[c.id] = {
      id: c.id,
      name: c.name,
      parent_id: c.parent_id,
      children: [],
      topics: [],
      topic_count: 0,
      total_topic_count: 0,
    }
  }

  const roots = []
  for (const node of Object.values(byId)) {
    if (node.parent_id && byId[node.parent_id]) {
      byId[node.parent_id].children.push(node)
    } else {
      roots.push(node)
    }
  }

  const topics = db.find('topics', { user_id: userId })

  for (const t of topics) {
    const cat = byId[t.category_id]
    if (cat) {
      cat.topics.push({
        id: t.id,
        title: t.title,
        description: t.description || '',
        category_id: t.category_id,
        category_name: cat.name,
        mcq_count: db.count('mcqs', { topic_id: t.id }),
        reading_count: db.count('reading_blocks', { topic_id: t.id }),
        formula_count: db.count('formulas', { topic_id: t.id }),
        note_count: db.count('notes', { topic_id: t.id }),
      })
      cat.topic_count += 1
    }
  }

  function rollup(cat, visited = new Set()) {
    if (visited.has(cat.id)) {
      console.error('Cycle detected in category tree at category:', cat.name, 'id:', cat.id)
      return 0
    }
    visited.add(cat.id)
    let total = cat.topic_count
    for (const child of cat.children) total += rollup(child, visited)
    cat.total_topic_count = total
    return total
  }
  for (const root of roots) rollup(root)

  return roots
}

async function topicDetail(db, userId, topicId) {
  const topic = db.findOne('topics', { id: topicId, user_id: userId })
  if (!topic) return null

  const cat = db.get('categories', topic.category_id)
  const topicDict = { ...topic, category_name: cat ? cat.name : '' }

  const readings = db.find('reading_blocks', { topic_id: topicId })
  readings.sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0))

  const formulas = db.find('formulas', { topic_id: topicId })
  formulas.sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0))

  const notes = db.find('notes', { topic_id: topicId })
  notes.sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0))

  const mcqRows = db.find('mcqs', { topic_id: topicId })
  mcqRows.sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0))

  const questions = mcqRows.map(row => ({
    id: row.id,
    question: row.question,
    options: parseOptions(row.options),
    answer: row.answer,
    explanation: row.explanation || '',
    difficulty: row.difficulty || 'medium',
  }))

  const counts = { reading: readings.length, formulas: formulas.length, notes: notes.length, mcqs: questions.length }
  const defaultTab = Object.keys(counts).find(k => counts[k]) || 'reading'

  return { topic: topicDict, readings, formulas, notes, questions, counts, default_tab: defaultTab }
}

async function dailyPlan(db, userId, planDate) {
  const plans = db.find('daily_plans', { user_id: userId, plan_date: planDate })
  const result = { topics: [], reading: [], formulas: [], notes: [], mcqs: [], todos: [] }

  for (const plan of plans) {
    const t = db.get('topics', plan.topic_id)
    if (t) result.topics.push({ id: t.id, title: t.title })
  }

  const topicIds = plans.map(p => p.topic_id)
  if (topicIds.length === 0) return result
  const topicSet = new Set(topicIds)

  for (const r of db.find('reading_blocks')) { if (topicSet.has(r.topic_id)) result.reading.push(r) }
  for (const f of db.find('formulas')) { if (topicSet.has(f.topic_id)) result.formulas.push(f) }
  for (const n of db.find('notes')) { if (topicSet.has(n.topic_id)) result.notes.push(n) }
  for (const m of db.find('mcqs')) {
    if (topicSet.has(m.topic_id)) {
      const mCopy = { ...m }
      mCopy.options = parseOptions(m.options || '[]')
      delete mCopy.answer
      result.mcqs.push(mCopy)
    }
  }
  for (const td of db.find('todos')) { if (topicSet.has(td.topic_id)) result.todos.push(td) }

  return result
}

async function listMcqs(db, userId) {
  const topics = db.find('topics', { user_id: userId })
  const topicTitles = {}
  for (const t of topics) topicTitles[t.id] = t.title

  const progressRecords = db.find('progress', { user_id: userId })
  const progressByMcq = {}
  for (const p of progressRecords) progressByMcq[p.mcq_id] = p

  const result = []
  const userTopicIds = new Set(topics.map(t => t.id))
  for (const m of db.find('mcqs')) {
    if (!userTopicIds.has(m.topic_id)) continue
    const p = progressByMcq[m.id]
    result.push({
      id: m.id,
      topic_title: topicTitles[m.topic_id] || '',
      question: m.question,
      options: parseOptions(m.options || '[]'),
      explanation: m.explanation || '',
      difficulty: m.difficulty || 'medium',
      attempts: p ? p.attempts || 0 : 0,
      correct_count: p ? p.correct_count || 0 : 0,
    })
  }

  result.sort((a, b) => (a.topic_title || '').localeCompare(b.topic_title || '') || (a.id || 0) - (b.id || 0))
  return result
}

async function saveParsedDocument(db, userId, parsed, filename) {
  const meta = parsed.metadata
  let parentId = null
  let categoryId

  if (meta.subcategory) {
    parentId = await getOrCreateCategory(db, meta.category, null, userId)
    categoryId = await getOrCreateCategory(db, meta.subcategory, parentId, userId)
  } else {
    categoryId = await getOrCreateCategory(db, meta.category, null, userId)
  }

  const docId = await db.insert('documents', { user_id: userId, filename })

  const topicId = await db.insert('topics', {
    user_id: userId,
    document_id: docId,
    category_id: categoryId,
    title: meta.title,
    description: meta.description || '',
  })

  const readingRecords = parsed.reading.map(item => ({
    topic_id: topicId, title: item.title, content: item.content, order_idx: item.order_idx,
  }))
  if (readingRecords.length > 0) await db.insertMany('reading_blocks', readingRecords)

  const formulaRecords = parsed.formulas.map(item => ({
    topic_id: topicId, title: item.title, content: item.content, order_idx: item.order_idx,
  }))
  if (formulaRecords.length > 0) await db.insertMany('formulas', formulaRecords)

  const mcqRecords = parsed.mcqs.map(item => ({
    topic_id: topicId, question: item.question, options: item.options,
    answer: item.answer, explanation: item.explanation || '',
    difficulty: item.difficulty || 'medium', order_idx: item.order_idx,
  }))
  if (mcqRecords.length > 0) await db.insertMany('mcqs', mcqRecords)

  const noteRecords = parsed.notes.map(item => ({
    topic_id: topicId, content: item.content, order_idx: item.order_idx,
  }))
  if (noteRecords.length > 0) await db.insertMany('notes', noteRecords)

  const todoRecords = parsed.todos.map(item => ({
    topic_id: topicId, content: item.content, is_completed: item.is_completed || 0, order_idx: item.order_idx,
  }))
  if (todoRecords.length > 0) await db.insertMany('todos', todoRecords)

  return topicId
}

module.exports = { dashboardSummary, libraryTree, topicDetail, dailyPlan, listMcqs, saveParsedDocument }
