import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiBook, FiFileText, FiHelpCircle, FiList, FiArrowRight,
  FiTrendingUp, FiClock, FiCheckSquare
} from 'react-icons/fi'
import client from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { PageSkeleton } from '../components/LoadingSpinner'

const statCards = [
  { key: 'topic_count', icon: FiBook, label: 'Topics', color: 'from-sky-400 to-blue-600', link: '/library' },
  { key: 'reading_count', icon: FiFileText, label: 'Reading Blocks', color: 'from-violet-400 to-purple-600', link: '/reading' },
  { key: 'mcq_count', icon: FiHelpCircle, label: 'MCQs', color: 'from-emerald-400 to-teal-600', link: '/mcqs' },
  { key: 'pending_todos', icon: FiList, label: 'Pending Todos', color: 'from-amber-400 to-orange-600', link: '/todos' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await client.get('/dashboard')
        setData(res)
      } catch (err) {
        console.error('Failed to load dashboard', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <PageSkeleton />

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-tertiary)' }}>Failed to load dashboard</p>
      </div>
    )
  }

  const { stats, topics, reading, mcqs, todos } = data

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Overview of your learning progress</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon
          const value = stats?.[stat.key] ?? 0
          return (
            <motion.div key={stat.key} variants={item}>
              <Link to={stat.link} className="card-hoverable block p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <FiTrendingUp className="w-4 h-4 inline mr-2" />
                Recent Topics
              </h2>
              <Link to="/library" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                View all <FiArrowRight className="w-3 h-3 inline" />
              </Link>
            </div>
            <div className="p-5">
              {topics?.length > 0 ? (
                <div className="space-y-2">
                  {topics.slice(0, 5).map((topic) => (
                    <Link
                      key={topic.id}
                      to={`/topics/${topic.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <FiBook className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                      <span className="text-sm">{topic.title}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No topics yet. Upload a document to get started.</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Reading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <FiClock className="w-4 h-4 inline mr-2" />
                Recent Reading
              </h2>
              <Link to="/reading" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                View all <FiArrowRight className="w-3 h-3 inline" />
              </Link>
            </div>
            <div className="p-5">
              {reading?.length > 0 ? (
                <div className="space-y-3">
                  {reading.slice(0, 3).map((block) => (
                    <Link
                      key={block.id}
                      to={`/reading/${block.id}`}
                      className="block transition-colors"
                    >
                      <div className="card p-4">
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          {block.title || 'Untitled'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No reading content yet.</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent MCQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <FiHelpCircle className="w-4 h-4 inline mr-2" />
                Recent MCQs
              </h2>
              <Link to="/mcqs" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                View all <FiArrowRight className="w-3 h-3 inline" />
              </Link>
            </div>
            <div className="p-5">
              {mcqs?.length > 0 ? (
                <div className="space-y-2">
                  {mcqs.slice(0, 4).map((mcq) => (
                    <div key={mcq.id} className="text-sm py-2 border-b last:border-0" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <p className="line-clamp-1">{mcq.question}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No MCQs yet.</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pending Todos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                <FiCheckSquare className="w-4 h-4 inline mr-2" />
                Pending Todos
              </h2>
              <Link to="/todos" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                View all <FiArrowRight className="w-3 h-3 inline" />
              </Link>
            </div>
            <div className="p-5">
              {todos?.length > 0 ? (
                <div className="space-y-2">
                  {todos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <div className="w-4 h-4 rounded border-2 shrink-0" style={{ borderColor: 'var(--border)' }} />
                      <span className={todo.is_completed ? 'line-through' : ''}>{todo.content}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No pending todos.</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
