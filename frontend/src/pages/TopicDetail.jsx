import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiBook, FiFileText, FiHelpCircle, FiList, FiChevronLeft,
  FiTag, FiBarChart2, FiEdit2, FiCheck, FiX, FiTrash2
} from 'react-icons/fi'
import client from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'
import MCQQuestion from '../components/MCQQuestion'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function TopicDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('reading')
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const { data: res } = await client.get(`/topics/${id}`)
        setData(res)
      } catch (err) {
        console.error('Failed to load topic', err)
        toast.error('Failed to load topic')
      } finally {
        setLoading(false)
      }
    }
    fetchTopic()
  }, [id])

  const handleSaveTitle = async () => {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === data?.topic?.title) {
      setEditing(false)
      return
    }
    try {
      const res = await client.put(`/topics/${id}`, { title: trimmed })
      if (res.data.success) {
        setData(prev => ({
          ...prev,
          topic: { ...prev.topic, title: res.data.title }
        }))
        toast.success('Topic renamed')
      }
    } catch {
      toast.error('Failed to rename topic')
    }
    setEditing(false)
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await client.delete(`/topics/${id}`)
      toast.success('Topic deleted')
      navigate('/library')
    } catch {
      toast.error('Failed to delete topic')
      setDeleting(false)
    }
  }

  const handleMCQAnswer = async (mcqId, isCorrect) => {
    try {
      await client.post(`/mcqs/${mcqId}/answer`, { is_correct: isCorrect })
    } catch {
      // silent
    }
  }

  if (loading) return <LoadingSpinner />

  if (!data?.topic) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--text-tertiary)' }}>Topic not found</p>
        <Link to="/library" className="btn btn-primary mt-4">Back to Library</Link>
      </div>
    )
  }

  const { topic, readings, questions, formulas, notes } = data
  const reading_blocks = readings || []
  const mcqs = questions || []
  const todos = []  // not in API response

  const sections = [
    { id: 'reading', label: 'Reading', icon: FiFileText, count: reading_blocks?.length },
    { id: 'mcqs', label: 'MCQs', icon: FiHelpCircle, count: mcqs?.length },
    { id: 'formulas', label: 'Formulas', icon: FiBarChart2, count: formulas?.length },
    { id: 'notes', label: 'Notes', icon: FiList, count: notes?.length },
    { id: 'todos', label: 'Todos', icon: FiList, count: todos?.length },
  ].filter(s => s.count > 0)

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-4"
      >
        <Link
          to="/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </motion.div>

      {/* Topic Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0">
            <FiBook className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="flex-1 px-3 py-1.5 text-sm font-bold rounded-lg border outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--accent)',
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1.5 rounded-lg transition-colors hover:bg-green-500/20"
                  style={{ color: '#22c55e' }}
                >
                  <FiCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {topic.title}
                </h1>
                <button
                  onClick={() => { setEditTitle(topic.title); setEditing(true) }}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-tertiary)' }}
                  title="Edit title"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${topic.title}" and all its content?`)) {
                      handleDelete()
                    }
                  }}
                  disabled={deleting}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                  style={{ color: 'var(--text-tertiary)' }}
                  title="Delete topic"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {topic.category && (
              <div className="flex items-center gap-2 mt-0.5">
                <FiTag className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{topic.category}</span>
              </div>
            )}
          </div>
        </div>
        {topic.description && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{topic.description}</p>
        )}
      </motion.div>

      {/* Section Tabs */}
      {sections.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 mb-6 p-1 rounded-xl"
          style={{ background: 'var(--bg-elevated)' }}
        >
          {sections.map((sec) => {
            const Icon = sec.icon
            const isActive = activeSection === sec.id
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'shadow-sm' : ''
                }`}
                style={{
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <Icon className="w-4 h-4" />
                {sec.label}
                <span className="text-xs opacity-60">({sec.count})</span>
              </button>
            )
          })}
        </motion.div>
      )}

      {/* Reading Content */}
      {activeSection === 'reading' && reading_blocks?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {reading_blocks.map((block, i) => (
            <motion.article
              key={block.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card overflow-hidden"
            >
              {block.title && (
                <header className="px-6 pt-6 pb-2">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {block.title}
                  </h2>
                </header>
              )}
              <div className="px-6 pb-6">
                <MarkdownRenderer content={block.content} />
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      {/* MCQs */}
      {activeSection === 'mcqs' && mcqs?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {mcqs.map((mcq, i) => (
            <MCQQuestion
              key={mcq.id}
              question={mcq}
              onAnswer={handleMCQAnswer}
            />
          ))}
        </motion.div>
      )}

      {/* Formulas */}
      {activeSection === 'formulas' && formulas?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {formulas.map((formula, i) => (
            <motion.div
              key={formula.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--accent)' }}>
                {formula.title}
              </h3>
              <pre className="!mt-0 !mb-0 !rounded-lg !border-0" style={{ background: 'var(--bg-elevated)' }}>
                <code className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                  {formula.content}
                </code>
              </pre>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Notes */}
      {activeSection === 'notes' && notes?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card divide-y" style={{ borderColor: 'var(--border)' }}
        >
          {notes.map((note, i) => (
            <div key={note.id || i} className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="mr-2 float-left" style={{ color: 'var(--accent)' }}>•</span>
              <div className="overflow-hidden [&_.prose]:text-sm [&_.prose_p]:my-0 [&_.prose_p]:inline">
                <MarkdownRenderer content={note.content} />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Todos */}
      {activeSection === 'todos' && todos?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card divide-y" style={{ borderColor: 'var(--border)' }}
        >
          {todos.map((todo, i) => (
            <div key={todo.id || i} className="flex items-center gap-3 px-5 py-3">
              <div
                className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                  todo.is_completed ? 'bg-green-500 border-green-500' : ''
                }`}
                style={{ borderColor: todo.is_completed ? '#22c55e' : 'var(--border)' }}
              >
                {todo.is_completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm ${todo.is_completed ? 'line-through' : ''}`}
                style={{ color: todo.is_completed ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
              >
                {todo.content}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {sections.length === 0 && (
        <div className="card p-12 text-center">
          <FiBook className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No content in this topic yet.</p>
        </div>
      )}
    </div>
  )
}
