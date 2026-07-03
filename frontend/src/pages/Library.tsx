import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBook, FiFileText, FiHelpCircle, FiBarChart2, FiList,
  FiEdit2, FiTrash2, FiCheck, FiX, FiSearch, FiCalendar,
} from 'react-icons/fi'
import client from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

function flattenTopics(categories: any[]): { topic: any; categoryName: string }[] {
  const result: { topic: any; categoryName: string }[] = []
  function walk(cats: any[], parentName: string) {
    for (const cat of cats) {
      const name = cat.name || parentName
      for (const t of cat.topics || []) result.push({ topic: t, categoryName: name })
      if (cat.children) walk(cat.children, name)
    }
  }
  walk(categories, '')
  return result
}

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { ease: 'easeOut', duration: 0.3 } },
}

function TopicCard({
  topic, categoryName, onDateChange, onClearDate, onDelete,
  dateValue, editingId, editTitle, setEditTitle, setEditingId, handleSaveTitle, today, deleting,
}: {
  topic: any; categoryName: string; onDateChange: (id: number, date: string) => void;
  onClearDate: (id: number) => void; onDelete: (topic: any) => void;
  dateValue: string; editingId: number | null; editTitle: string;
  setEditTitle: (v: string) => void; setEditingId: (v: number | null) => void;
  handleSaveTitle: (id: number) => void; today: string; deleting: number | null;
}) {
  const hasDate = !!topic.plan_date
  const isEditing = editingId === topic.id

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      layout
      className="card group relative flex flex-col"
    >
      {/* Gradient accent bar */}
      <div className="h-1 shrink-0 rounded-t-[1rem] bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500" />

      <div className="flex flex-col gap-3 p-5 flex-1">
        {/* Header row: icon + title + actions */}
        <div className="flex items-start gap-3">
          <Link
            to={`/topics/${topic.id}`}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0 mt-0.5 hover:scale-105 transition-transform"
          >
            <FiBook className="w-5 h-5 text-white" />
          </Link>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(topic.id)}
                  className="flex-1 px-2 py-1 text-sm font-semibold rounded-lg border outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--accent)' }}
                  autoFocus
                />
                <button onClick={() => handleSaveTitle(topic.id)} className="p-1 text-green-500 shrink-0">
                  <FiCheck className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1 shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <Link
                  to={`/topics/${topic.id}`}
                  className="text-base font-semibold truncate block hover:underline decoration-2 underline-offset-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {topic.title}
                </Link>
                <button
                  onClick={() => { setEditTitle(topic.title); setEditingId(topic.id) }}
                  className="p-1 rounded opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label="Rename topic"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <span className="text-[11px] font-medium mt-0.5 block truncate" style={{ color: 'var(--accent)' }}>
              {categoryName}
            </span>
          </div>

          <button
            onClick={() => onDelete(topic)}
            disabled={deleting === topic.id}
            className="p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-500/10 shrink-0"
            style={{ color: deleting === topic.id ? 'var(--text-tertiary)' : '#f43f5e' }}
            aria-label="Delete topic"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="flex items-center gap-1.5"><FiFileText className="w-3.5 h-3.5" /> {topic.reading_count}</span>
          <span className="flex items-center gap-1.5"><FiHelpCircle className="w-3.5 h-3.5" /> {topic.mcq_count}</span>
          <span className="flex items-center gap-1.5"><FiBarChart2 className="w-3.5 h-3.5" /> {topic.formula_count}</span>
          <span className="flex items-center gap-1.5"><FiList className="w-3.5 h-3.5" /> {topic.note_count}</span>
        </div>

        {/* Date assignment */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <FiCalendar className="w-3.5 h-3.5 shrink-0" style={{ color: hasDate ? 'var(--accent)' : 'var(--text-tertiary)' }} />
          <input
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(topic.id, e.target.value)}
            min={today}
            className="flex-1 min-w-0 px-2 py-1 text-[11px] rounded-lg border outline-none transition-colors"
            style={{
              background: 'var(--bg-elevated)',
              color: hasDate ? 'var(--accent)' : 'var(--text-tertiary)',
              borderColor: hasDate ? 'var(--accent)' : 'var(--border)',
            }}
          />
          {hasDate && (
            <>
              <span className="text-[11px] whitespace-nowrap hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>
                {topic.plan_date === today ? 'Today' : topic.plan_date}
              </span>
              <button
                onClick={() => onClearDate(topic.id)}
                className="p-1 rounded hover:bg-red-500/10 transition-colors shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
                aria-label="Clear date"
              >
                <FiX className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const containerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
}

export default function Library() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [topicsMap, setTopicsMap] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [dateInputs, setDateInputs] = useState<Record<number, string>>({})
  const [deleting, setDeleting] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [libRes, trackerRes] = await Promise.all([
          client.get('/library'),
          client.get('/topics/tracker'),
        ])
        setCategories(libRes.data.categories || [])
        const map: Record<number, any> = {}
        const dates: Record<number, string> = {}
        for (const t of trackerRes.data || []) {
          map[t.id] = t
          dates[t.id] = t.plan_date || ''
        }
        setTopicsMap(map)
        setDateInputs(dates)
      } catch {
        toast.error('Failed to load library')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  // Derive flat topic list from category tree + tracker map
  const { allItems, uniqueCategories } = useMemo(() => {
    const flat = flattenTopics(categories)
    const items = flat
      .map(({ topic, categoryName }) => {
        const t = topicsMap[topic.id]
        if (!t) return null
        return { ...t, category_name: categoryName }
      })
      .filter(Boolean)
    const cats = [...new Set(items.map((t: any) => t.category_name).filter(Boolean))].sort()
    return { allItems: items, uniqueCategories: cats }
  }, [categories, topicsMap])

  // Apply filters
  const filtered = useMemo(() => {
    let list = allItems
    if (activeCategory) list = list.filter((t: any) => t.category_name === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((t: any) => t.title?.toLowerCase().includes(q))
    }
    return list
  }, [allItems, activeCategory, search])

  const handleSaveTitle = async (id: number) => {
    const trimmed = editTitle.trim()
    if (!trimmed) { setEditingId(null); return }
    try {
      await client.put(`/topics/${id}`, { title: trimmed })
      setTopicsMap((prev: Record<number, any>) => {
        const next = { ...prev }
        if (next[id]) next[id] = { ...next[id], title: trimmed }
        return next
      })
      toast.success('Topic renamed')
    } catch {
      toast.error('Failed to rename')
    }
    setEditingId(null)
  }

  const handleDateChange = async (topicId: number, date: string) => {
    setDateInputs((prev: Record<number, string>) => ({ ...prev, [topicId]: date }))
    if (!date) return
    try {
      await client.post('/calendar/assign', { topic_id: topicId, date })
      setTopicsMap((prev: Record<number, any>) => {
        const next = { ...prev }
        if (next[topicId]) next[topicId] = { ...next[topicId], plan_date: date }
        return next
      })
    } catch {
      toast.error('Failed to assign date')
    }
  }

  const handleClearDate = async (topicId: number) => {
    setDateInputs((prev: Record<number, string>) => ({ ...prev, [topicId]: '' }))
    try {
      await client.post('/calendar/assign', { topic_id: topicId, date: '' })
      setTopicsMap((prev: Record<number, any>) => {
        const next = { ...prev }
        if (next[topicId]) next[topicId] = { ...next[topicId], plan_date: null }
        return next
      })
    } catch {
      toast.error('Failed to clear date')
    }
  }

  const handleDelete = async (topic: any) => {
    if (!window.confirm(`Delete "${topic.title}" and all its content?`)) return
    setDeleting(topic.id)
    try {
      await client.delete(`/topics/${topic.id}`)
      setTopicsMap((prev: Record<number, any>) => {
        const next = { ...prev }
        delete next[topic.id]
        return next
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete')
    }
    setDeleting(null)
  }

  if (loading) return <LoadingSpinner />

  const today = new Date().toISOString().split('T')[0]
  const hasTopics = allItems.length > 0

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Library</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {allItems.length} topic{allItems.length !== 1 ? 's' : ''}
            {activeCategory && <span> in <strong style={{ color: 'var(--accent)' }}>{activeCategory}</strong></span>}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border outline-none transition-colors"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              borderColor: search ? 'var(--accent)' : 'var(--border)',
            }}
          />
        </div>
      </motion.div>

      {hasTopics ? (
        <>
          {/* Category filter chips */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-wrap items-center gap-2 mb-6"
          >
            <button
              onClick={() => setActiveCategory('')}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border"
              style={{
                background: !activeCategory ? 'var(--accent)' : 'var(--bg-elevated)',
                color: !activeCategory ? '#fff' : 'var(--text-secondary)',
                borderColor: !activeCategory ? 'var(--accent)' : 'var(--border)',
              }}
            >
              All
            </button>
            {uniqueCategories.map((name: string) => (
              <button
                key={name}
                onClick={() => setActiveCategory(activeCategory === name ? '' : name)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border"
                style={{
                  background: activeCategory === name ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: activeCategory === name ? '#fff' : 'var(--text-secondary)',
                  borderColor: activeCategory === name ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {name}
              </button>
            ))}
          </motion.div>

          {/* Topic grid */}
          {filtered.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((t: any) => (
                  <TopicCard
                    key={t.id}
                    topic={t}
                    categoryName={t.category_name}
                    onDateChange={handleDateChange}
                    onClearDate={handleClearDate}
                    onDelete={handleDelete}
                    dateValue={dateInputs[t.id] || ''}
                    editingId={editingId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    setEditingId={setEditingId}
                    handleSaveTitle={handleSaveTitle}
                    today={today}
                    deleting={deleting}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-12 text-center"
            >
              <FiSearch className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {search ? 'No topics match your search.' : 'No topics in this category.'}
              </p>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <FiBook className="w-8 h-8 text-white" />
          </div>
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Your library is empty
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
            Upload a document to create your first topic.
          </p>
          <Link to="/upload" className="btn btn-primary">
            Upload Document
          </Link>
        </motion.div>
      )}
    </div>
  )
}
