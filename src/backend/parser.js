function clean(value, fallback = '') {
  if (value == null) return fallback
  const s = String(value).trim()
  return s || fallback
}

function parseMarkdown(content) {
  const result = {
    metadata: { title: 'Untitled', category: 'General', subcategory: null, description: '' },
    reading: [],
    formulas: [],
    mcqs: [],
    notes: [],
    todos: [],
  }

  const lines = content.split('\n')
  let orderIdx = 0
  let inCodeBlock = false
  let currentH2 = null
  const sections = {}
  let sectionBuffer = []

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      sectionBuffer.push(line)
      continue
    }
    if (line.startsWith('# ') && !inCodeBlock) {
      const title = clean(line.slice(2))
      if (title) result.metadata.title = title
      sectionBuffer.push(line)
      continue
    }
    if (line.startsWith('## ') && !inCodeBlock) {
      if (currentH2 && sectionBuffer.length > 0) {
        sections[currentH2] = sectionBuffer.join('\n').trim()
      }
      currentH2 = clean(line.slice(3)).toLowerCase().replace(/\s+/g, '_')
      sectionBuffer = []
    } else {
      sectionBuffer.push(line)
    }
  }
  if (currentH2 && sectionBuffer.length > 0) {
    sections[currentH2] = sectionBuffer.join('\n').trim()
  }

  const metaText = sections.metadata || ''
  for (const line of metaText.split('\n')) {
    const trimmed = line.trim()
    const lower = trimmed.toLowerCase()
    if (lower.startsWith('- category:')) {
      result.metadata.category = clean(trimmed.split(':')[1], 'General')
    } else if (lower.startsWith('- subcategory:')) {
      const val = clean(trimmed.split(':')[1])
      result.metadata.subcategory = val || null
    } else if (lower.startsWith('- description:')) {
      result.metadata.description = clean(trimmed.split(':')[1])
    }
  }

  let readingKey = null
  for (const key of ['content', 'reading']) {
    if (sections[key]) { readingKey = key; break }
  }

  if (readingKey) {
    const readingText = sections[readingKey]
    const readingSections = readingText.split(/\n(?=### )/)
    for (const sec of readingSections) {
      const trimmed = sec.trim()
      if (!trimmed) continue
      let title = ''
      const contentLines = []
      for (const line of trimmed.split('\n')) {
        if (line.startsWith('### ')) {
          title = clean(line.slice(4))
        } else {
          contentLines.push(line)
        }
      }
      const body = contentLines.join('\n').trim()
      if (body) {
        result.reading.push({ title: title || 'Section', content: body, order_idx: orderIdx })
        orderIdx++
      }
    }
  }

  const formulasText = sections.formulas || ''
  if (formulasText) {
    for (const line of formulasText.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const m = trimmed.match(/\*\*(.+?):\*\*\s*(.+)/)
      if (m) {
        const title = clean(m[1])
        const content = clean(m[2])
        if (title && content) {
          result.formulas.push({ title, content, order_idx: orderIdx })
          orderIdx++
        }
      }
    }
  }

  const mcqsText = sections.mcqs || ''
  if (mcqsText) {
    const mcqBlocks = mcqsText.split(/\n(?=\*\*Q\d+:)/)
    for (const block of mcqBlocks) {
      const b = block.trim()
      if (!b) continue
      const qMatch = b.match(/\*\*Q\d+:\*\*\s*(.+?)(?=\n(?:-\s+[A-D]\)))/s)
      if (!qMatch) continue
      const question = clean(qMatch[1])

      const options = []
      const optMatches = b.matchAll(/-\s*([A-D])\)\s*(.+)/g)
      for (const match of optMatches) {
        options.push({ key: match[1].toUpperCase(), text: clean(match[2]) })
      }

      const answerM = b.match(/\*\*Answer:\*\*\s*([A-D])/)
      const answer = answerM ? clean(answerM[1]).toUpperCase() : ''

      const difficultyM = b.match(/\*\*Difficulty:\*\*\s*(.+)/)
      const difficulty = difficultyM ? clean(difficultyM[1], 'medium').toLowerCase() : 'medium'

      const explM = b.match(/\*\*Explanation:\*\*\s*(.+)/s)
      const explanation = explM ? clean(explM[1]) : ''

      if (options.length > 0 && answer) {
        result.mcqs.push({
          question,
          options: JSON.stringify(options),
          answer,
          explanation,
          difficulty,
          order_idx: orderIdx,
        })
        orderIdx++
      }
    }
  }

  const notesText = sections.notes || ''
  if (notesText) {
    for (const line of notesText.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('- ')) {
        const note = clean(trimmed.slice(2))
        if (note) {
          result.notes.push({ content: note, order_idx: orderIdx })
          orderIdx++
        }
      }
    }
  }

  const todosText = sections.todos || ''
  if (todosText) {
    for (const line of todosText.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('- [ ]')) {
        const todo = clean(trimmed.slice(5))
        if (todo) {
          result.todos.push({ content: todo, is_completed: 0, order_idx: orderIdx })
          orderIdx++
        }
      } else if (trimmed.startsWith('- [x]')) {
        const todo = clean(trimmed.slice(5))
        if (todo) {
          result.todos.push({ content: todo, is_completed: 1, order_idx: orderIdx })
          orderIdx++
        }
      } else if (trimmed.startsWith('- ')) {
        const todo = clean(trimmed.slice(2))
        if (todo) {
          result.todos.push({ content: todo, is_completed: 0, order_idx: orderIdx })
          orderIdx++
        }
      }
    }
  }

  return result
}

async function getOrCreateCategory(db, name, parentName = null, userId = null) {
  const catName = clean(name, 'General')
  let parentId = null

  if (typeof parentName === 'number') {
    parentId = parentName
  } else if (parentName) {
    const pName = clean(parentName, null)
    if (pName) {
      let parent = db.findOne('categories', { name: pName, parent_id: null, user_id: userId })
      if (parent) {
        parentId = parent.id
      } else {
        parentId = await db.insert('categories', { name: pName, parent_id: null, user_id: userId })
      }
    }
  }

  let category = db.findOne('categories', { name: catName, parent_id: parentId, user_id: userId })
  if (category) return category.id
  return await db.insert('categories', { name: catName, parent_id: parentId, user_id: userId })
}

module.exports = { parseMarkdown, getOrCreateCategory }
