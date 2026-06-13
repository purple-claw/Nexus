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
  if (plans.length > 0) {
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
  } else {
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

  for (const tid of topicIds) {
    for (const r of db.find('reading_blocks', { topic_id: tid })) reading.push(r)
    for (const m of db.find('mcqs', { topic_id: tid })) {
      const mCopy = { ...m }
      mCopy.options = parseOptions(m.options || '[]')
      mcqs.push(mCopy)
    }
    for (const td of db.find('todos', { topic_id: tid })) todos.push(td)
  }

  const pendingTodos = todos.filter(t => !t.is_completed).length

  let mcqAttempts = 0
  let mcqCorrect = 0
  for (const m of mcqs) {
    const p = db.findOne('progress', { user_id: userId, mcq_id: m.id })
    if (p) {
      mcqAttempts += p.attempts || 0
      mcqCorrect += p.correct_count || 0
    }
  }
  const accuracy = mcqAttempts > 0 ? Math.round((mcqCorrect / mcqAttempts) * 100) : null

  const userTopicIds = new Set(db.find('topics', { user_id: userId }).map(t => t.id))
  const totalReading = db.find('reading_blocks').filter(r => userTopicIds.has(r.topic_id)).length
  const totalMcqs = db.find('mcqs').filter(m => userTopicIds.has(m.topic_id)).length
  const totalTodos = pendingTodos || db.find('todos').filter(td => userTopicIds.has(td.topic_id) && !td.is_completed).length

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

  function rollup(cat) {
    let total = cat.topic_count
    for (const child of cat.children) total += rollup(child)
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
  const result = { topics: [], reading: [], mcqs: [], todos: [] }

  for (const plan of plans) {
    const t = db.get('topics', plan.topic_id)
    if (t) result.topics.push({ id: t.id, title: t.title })
  }

  const topicIds = plans.map(p => p.topic_id)
  if (topicIds.length === 0) return result

  for (const tid of topicIds) {
    for (const r of db.find('reading_blocks', { topic_id: tid })) result.reading.push(r)
    for (const m of db.find('mcqs', { topic_id: tid })) {
      const mCopy = { ...m }
      mCopy.options = parseOptions(m.options || '[]')
      result.mcqs.push(mCopy)
    }
    for (const td of db.find('todos', { topic_id: tid })) result.todos.push(td)
  }

  return result
}

async function listMcqs(db, userId) {
  const topics = db.find('topics', { user_id: userId })
  const result = []

  for (const t of topics) {
    for (const m of db.find('mcqs', { topic_id: t.id })) {
      const p = db.findOne('progress', { user_id: userId, mcq_id: m.id })
      result.push({
        id: m.id,
        topic_title: t.title,
        question: m.question,
        options: parseOptions(m.options || '[]'),
        answer: m.answer,
        explanation: m.explanation || '',
        difficulty: m.difficulty || 'medium',
        attempts: p ? p.attempts || 0 : 0,
        correct_count: p ? p.correct_count || 0 : 0,
      })
    }
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
