import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiBook, FiFileText, FiHelpCircle, FiBarChart2, FiList,
  FiChevronDown, FiEdit2, FiTrash2, FiCheck, FiX, FiFolder,
} from 'react-icons/fi'
import client from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

function TopicCard({ topic, onDateChange, onClearDate, onEdit: _onEdit, onDelete, dateInputs, editingId, editTitle, setEditTitle, setEditingId, handleSaveTitle, today, deleting }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-start gap-4">
        <Link
          to={`/topics/${topic.id}`}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0 mt-0.5"
        >
          <FiBook className="w-4 h-4 text-white" />
        </Link>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            {editingId === topic.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(topic.id)}
                  className="flex-1 px-2 py-1 text-sm font-medium rounded-lg border outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--accent)' }}
                  autoFocus
                />
                <button onClick={() => handleSaveTitle(topic.id)} className="p-1 text-green-500">
                  <FiCheck className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1" style={{ color: 'var(--text-tertiary)' }}>
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0 group">
                <Link
                  to={`/topics/${topic.id}`}
                  className="text-sm font-semibold truncate hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {topic.title}
                </Link>
                <button
                  onClick={() => { setEditTitle(topic.title); setEditingId(topic.id) }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <FiEdit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {topic.category_name && <span className="font-medium" style={{ color: 'var(--accent)' }}>{topic.category_name}</span>}
            <span className="flex items-center gap-1"><FiFileText className="w-3 h-3" /> {topic.reading_count}</span>
            <span className="flex items-center gap-1"><FiHelpCircle className="w-3 h-3" /> {topic.mcq_count}</span>
            <span className="flex items-center gap-1"><FiBarChart2 className="w-3 h-3" /> {topic.formula_count}</span>
            <span className="flex items-center gap-1"><FiList className="w-3 h-3" /> {topic.note_count}</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateInputs[topic.id] || ''}
              onChange={(e) => onDateChange(topic.id, e.target.value)}
              min={today}
              className="px-2 py-1 text-xs rounded-lg border outline-none"
              style={{
                background: 'var(--bg-elevated)',
                color: topic.plan_date ? 'var(--accent)' : 'var(--text-tertiary)',
                borderColor: topic.plan_date ? 'var(--accent)' : 'var(--border)',
              }}
            />
            {topic.plan_date && (
              <button
                onClick={() => onClearDate(topic.id)}
                className="p-1 rounded hover:bg-red-500/10 transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                title="Clear date"
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
            {topic.plan_date && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {topic.plan_date === today ? 'Today' : topic.plan_date}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(topic)}
          disabled={deleting === topic.id}
          className="p-2 rounded-lg transition-colors hover:bg-red-500/10 shrink-0"
          style={{ color: deleting === topic.id ? 'var(--text-tertiary)' : '#f43f5e' }}
          title="Delete topic"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

function CategorySection({ category, defaultOpen, allTopicsMap, onDateChange, onClearDate, onEdit, onDelete, dateInputs, editingId, editTitle, setEditTitle, setEditingId, handleSaveTitle, today, deleting }) {
  const [open, setOpen] = useState(defaultOpen)
  const topics = (category.topics || []).filter(t => allTopicsMap[t.id])

  if (!topics.length && !category.children?.length) return null

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-lg transition-colors"
        style={{ color: 'var(--text-primary)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <FiChevronDown
          className={`w-4 h-4 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
          style={{ color: 'var(--text-tertiary)' }}
        />
        <FiFolder className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <span className="text-sm font-medium">{category.name}</span>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
          {topics.length} topics
        </span>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="ml-6 mt-2 space-y-2"
        >
          {topics.map((topic) => {
            const tracker = allTopicsMap[topic.id]
            return (
              <TopicCard
                key={topic.id}
                topic={tracker}
                onDateChange={onDateChange}
                onClearDate={onClearDate}
                onEdit={onEdit}
                onDelete={onDelete}
                dateInputs={dateInputs}
                editingId={editingId}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                setEditingId={setEditingId}
                handleSaveTitle={handleSaveTitle}
                today={today}
                deleting={deleting}
              />
            )
          })}
          {category.children?.map((child) => (
            <CategorySection
              key={child.name}
              category={child}
              defaultOpen={false}
              allTopicsMap={allTopicsMap}
              onDateChange={onDateChange}
              onClearDate={onClearDate}
              onEdit={onEdit}
              onDelete={onDelete}
              dateInputs={dateInputs}
              editingId={editingId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              setEditingId={setEditingId}
              handleSaveTitle={handleSaveTitle}
              today={today}
              deleting={deleting}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default function Library() {
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [topicsMap, setTopicsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [dateInputs, setDateInputs] = useState({})
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [libRes, trackerRes] = await Promise.all([
          client.get('/library'),
          client.get('/topics/tracker'),
        ])
        setCategories(libRes.data.categories || [])
        const map = {}
        const dates = {}
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

  const handleSaveTitle = async (id) => {
    const trimmed = editTitle.trim()
    if (!trimmed) { setEditingId(null); return }
    try {
      await client.put(`/topics/${id}`, { title: trimmed })
      setTopicsMap(prev => {
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

  const handleDateChange = async (topicId, date) => {
    setDateInputs(prev => ({ ...prev, [topicId]: date }))
    if (!date) return
    try {
      await client.post('/calendar/assign', { topic_id: topicId, date })
      setTopicsMap(prev => {
        const next = { ...prev }
        if (next[topicId]) next[topicId] = { ...next[topicId], plan_date: date }
        return next
      })
      toast.success('Date assigned')
    } catch {
      toast.error('Failed to assign date')
    }
  }

  const handleClearDate = async (topicId) => {
    setDateInputs(prev => ({ ...prev, [topicId]: '' }))
    try {
      await client.post('/calendar/assign', { topic_id: topicId, date: '' })
      setTopicsMap(prev => {
        const next = { ...prev }
        if (next[topicId]) next[topicId] = { ...next[topicId], plan_date: null }
        return next
      })
      toast.success('Date cleared')
    } catch {
      toast.error('Failed to clear date')
    }
  }

  const handleDelete = async (topic) => {
    if (!window.confirm(`Delete "${topic.title}" and all its content?`)) return
    setDeleting(topic.id)
    try {
      await client.delete(`/topics/${topic.id}`)
      setTopicsMap(prev => {
        const next = { ...prev }
        delete next[topic.id]
        return next
      })
      toast.success('Topic deleted')
    } catch (err) {
      console.error('Delete failed:', err?.response?.data || err.message || err)
      toast.error(err?.response?.data?.error || 'Failed to delete')
    }
    setDeleting(null)
  }

  if (loading) return <LoadingSpinner />

  const today = new Date().toISOString().split('T')[0]
  const hasTopics = Object.keys(topicsMap).length > 0

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Library</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Browse topics by category — manage titles, dates, and content</p>
      </motion.div>

      {hasTopics ? (
        <div className="card divide-y" style={{ borderColor: 'var(--border)' }}>
          {categories.map((cat, i) => (
            <CategorySection
              key={cat.name}
              category={cat}
              defaultOpen={i === 0}
              allTopicsMap={topicsMap}
              onDateChange={handleDateChange}
              onClearDate={handleClearDate}
              onEdit={() => {}}
              onDelete={handleDelete}
              dateInputs={dateInputs}
              editingId={editingId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              setEditingId={setEditingId}
              handleSaveTitle={handleSaveTitle}
              today={today}
              deleting={deleting}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FiBook className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No topics yet. Upload a document to get started.
          </p>
        </div>
      )}
    </div>
  )
}