import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiBook, FiFileText, FiHelpCircle, FiList, FiChevronLeft,
  FiTag, FiBarChart2, FiEdit2, FiCheck, FiX, FiTrash2,
  FiCopy, FiCheckCircle, FiBookOpen,
} from 'react-icons/fi'
import client from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'
import MCQQuestion from '../components/MCQQuestion'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg transition-all duration-200"
      style={{ color: copied ? '#22c55e' : 'var(--text-tertiary)' }}
      onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = 'var(--accent)' }}
      onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = 'var(--text-tertiary)' }}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
    </button>
  )
}

function ReadingBlockCard({ block, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, ease: 'easeOut' }}
      className="card overflow-hidden"
    >
      <div className="relative">
        {block.title && (
          <div className="px-6 pt-5 pb-1 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shrink-0">
              <FiFileText className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {block.title}
            </h2>
          </div>
        )}
        <div className="px-6 py-5">
          <MarkdownRenderer content={block.content} />
        </div>
      </div>
    </motion.div>
  )
}

function FormulaCard({ formula, index }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: 'easeOut' }}
      className="card overflow-hidden group"
    >
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shrink-0">
              <FiBarChart2 className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              {formula.title || 'Formula'}
            </h3>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={formula.content} />
          </div>
        </div>
        <div
          className="relative rounded-xl overflow-hidden cursor-pointer"
          style={{ background: 'var(--bg-elevated)' }}
          onClick={() => setExpanded(!expanded)}
        >
          <div className={`p-4 transition-all ${expanded ? '' : 'max-h-32 overflow-hidden'}`}>
            <pre className="!m-0 !bg-transparent !border-0">
              <code className="text-sm font-mono leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {formula.content}
              </code>
            </pre>
            {!expanded && formula.content.length > 200 && (
              <div
                className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                style={{
                  background: 'linear-gradient(transparent, var(--bg-elevated))',
                }}
              />
            )}
          </div>
          {formula.content.length > 200 && (
            <div className="px-4 pb-3">
              <button
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function NoteCard({ note, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, ease: 'easeOut' }}
      className="card overflow-hidden group"
    >
      <div className="p-5 flex items-start gap-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0 mt-0.5">
          <FiList className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm leading-relaxed [&_.prose]:text-sm [&_.prose_p]:my-1 [&_.prose_p]:inline"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MarkdownRenderer content={note.content} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function MCQCard({ mcq, index, onAnswer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: 'easeOut' }}
      className="card overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center shrink-0">
            <FiHelpCircle className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            Question {index + 1}
          </span>
        </div>
        <MCQQuestion question={mcq} onAnswer={onAnswer} />
      </div>
    </motion.div>
  )
}

function SectionTabs({ sections, active, onChange }) {
  return (
    <div className="flex gap-1.5 p-1.5 rounded-2xl overflow-x-auto" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: 'var(--glass-border)' }}>
      {sections.map((sec) => {
        const Icon = sec.icon
        const isActive = active === sec.id
        return (
          <button
            key={sec.id}
            onClick={() => onChange(sec.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              isActive ? '' : 'hover:bg-white/5 dark:hover:bg-white/5'
            }`}
            style={{
              background: isActive ? 'var(--accent-light)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: isActive ? `0 0 12px var(--accent-glow)` : 'none',
            }}
          >
            <Icon className="w-4 h-4" />
            {sec.label}
            <span className="text-[11px] opacity-60 ml-0.5">({sec.count})</span>
          </button>
        )
      })}
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { ease: 'easeOut' } },
}

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
  const todos = []

  const sections = [
    { id: 'reading', label: 'Reading', icon: FiFileText, count: reading_blocks.length },
    { id: 'mcqs', label: 'MCQs', icon: FiHelpCircle, count: mcqs.length },
    { id: 'formulas', label: 'Formulas', icon: FiBarChart2, count: formulas.length },
    { id: 'notes', label: 'Notes', icon: FiList, count: notes.length },
  ].filter(s => s.count > 0)

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-5"
      >
        <Link
          to="/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 group"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <FiChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to Library
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20">
              <FiBook className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="flex-1 px-3 py-1.5 text-base font-bold rounded-xl border outline-none"
                    style={{
                      background: 'var(--glass-bg)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--accent)',
                    }}
                    autoFocus
                  />
                  <button onClick={handleSaveTitle} className="p-2 rounded-xl transition-colors hover:bg-green-500/20" style={{ color: '#22c55e' }}>
                    <FiCheck className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(false)} className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-tertiary)' }}>
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
                    className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10 dark:hover:bg-white/10"
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
                    className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/10"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Delete topic"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                {topic.category && (
                  <div className="flex items-center gap-1.5">
                    <FiTag className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{topic.category}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="flex items-center gap-1"><FiFileText className="w-3 h-3" /> {reading_blocks.length}</span>
                  <span className="flex items-center gap-1"><FiHelpCircle className="w-3 h-3" /> {mcqs.length}</span>
                  <span className="flex items-center gap-1"><FiBarChart2 className="w-3 h-3" /> {formulas.length}</span>
                  <span className="flex items-center gap-1"><FiList className="w-3 h-3" /> {notes.length}</span>
                </div>
              </div>
            </div>
          </div>
          {topic.description && (
            <p className="text-sm mt-4 pt-4 border-t" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
              {topic.description}
            </p>
          )}
        </div>
      </motion.div>

      {sections.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <SectionTabs sections={sections} active={activeSection} onChange={setActiveSection} />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {activeSection === 'reading' && reading_blocks.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-5"
            >
              {reading_blocks.map((block, i) => (
                <ReadingBlockCard key={block.id} block={block} index={i} />
              ))}
            </motion.div>
          )}

          {activeSection === 'mcqs' && mcqs.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {mcqs.map((mcq, i) => (
                <MCQCard key={mcq.id} mcq={mcq} index={i} onAnswer={handleMCQAnswer} />
              ))}
            </motion.div>
          )}

          {activeSection === 'formulas' && formulas.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2"
            >
              {formulas.map((formula, i) => (
                <FormulaCard key={formula.id || i} formula={formula} index={i} />
              ))}
            </motion.div>
          )}

          {activeSection === 'notes' && notes.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {notes.map((note, i) => (
                <NoteCard key={note.id || i} note={note} index={i} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {sections.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-16 text-center"
        >
          <FiBookOpen className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
            No content in this topic yet.
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
            Upload a document to get started.
          </p>
        </motion.div>
      )}
    </div>
  )
}