import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiMapPin, FiEdit2, FiTrash2, FiCheck, FiX,
  FiBook, FiFileText, FiHelpCircle, FiBarChart2, FiList,
} from 'react-icons/fi'
import client from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function TopicTracker() {
  const { toast } = useToast()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [dateInputs, setDateInputs] = useState({})
  const [deleting, setDeleting] = useState(null)

  const fetchTopics = async () => {
    try {
      const { data } = await client.get('/topics/tracker')
      setTopics(data || [])
      const dates = {}
      for (const t of data || []) {
        dates[t.id] = t.plan_date || ''
      }
      setDateInputs(dates)
    } catch {
      toast.error('Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTopics() }, [])

  const handleSaveTitle = async (id) => {
    const trimmed = editTitle.trim()
    if (!trimmed) { setEditingId(null); return }
    try {
      await client.put(`/topics/${id}`, { title: trimmed })
      setTopics(prev => prev.map(t => t.id === id ? { ...t, title: trimmed } : t))
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
      setTopics(prev => prev.map(t => t.id === topicId ? { ...t, plan_date: date } : t))
      toast.success('Date assigned')
    } catch {
      toast.error('Failed to assign date')
    }
  }

  const handleClearDate = async (topicId) => {
    setDateInputs(prev => ({ ...prev, [topicId]: '' }))
    try {
      await client.post('/calendar/assign', { topic_id: topicId, date: '' })
      setTopics(prev => prev.map(t => t.id === topicId ? { ...t, plan_date: null } : t))
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
      setTopics(prev => prev.filter(t => t.id !== topic.id))
      toast.success('Topic deleted')
    } catch {
      toast.error('Failed to delete')
    }
    setDeleting(null)
  }

  if (loading) return <LoadingSpinner />

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <FiMapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Topic Tracker</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Manage all topics — edit titles, assign dates, track content
            </p>
          </div>
        </div>
      </motion.div>

      {topics.length === 0 ? (
        <div className="card p-12 text-center">
          <FiBook className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No topics yet. Upload a document to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic, i) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-4"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <Link
                  to={`/topics/${topic.id}`}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0 mt-0.5"
                >
                  <FiBook className="w-4 h-4 text-white" />
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title row */}
                  <div className="flex items-center gap-2">
                    {editingId === topic.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(topic.id)}
                          className="flex-1 px-2 py-1 text-sm font-medium rounded-lg border outline-none"
                          style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--accent)',
                          }}
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
                      <>
                        <Link
                          to={`/topics/${topic.id}`}
                          className="text-sm font-semibold truncate hover:underline"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {topic.title}
                        </Link>
                        <button
                          onClick={() => { setEditTitle(topic.title); setEditingId(topic.id) }}
                          className="p-1 rounded opacity-0 hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <FiEdit2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Category & Stats row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {topic.category_name && (
                      <span>{topic.category_name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiFileText className="w-3 h-3" /> {topic.reading_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiHelpCircle className="w-3 h-3" /> {topic.mcq_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiBarChart2 className="w-3 h-3" /> {topic.formula_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiList className="w-3 h-3" /> {topic.note_count}
                    </span>
                  </div>

                  {/* Date row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dateInputs[topic.id] || ''}
                      onChange={(e) => handleDateChange(topic.id, e.target.value)}
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
                        onClick={() => handleClearDate(topic.id)}
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

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(topic)}
                    disabled={deleting === topic.id}
                    className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                    style={{ color: deleting === topic.id ? 'var(--text-tertiary)' : '#f43f5e' }}
                    title="Delete topic"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}