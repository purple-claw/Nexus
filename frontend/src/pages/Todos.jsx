import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiList, FiTarget, FiCheckCircle, FiClock,
} from 'react-icons/fi'
import client from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { ease: 'easeOut', duration: 0.35 } },
  exit: { opacity: 0, x: 60, transition: { duration: 0.2 } },
}

const progressVariants = {
  initial: { width: 0 },
  animate: (pct) => ({ width: `${pct}%`, transition: { duration: 0.8, ease: 'easeOut' } }),
}

function TodoCard({ todo, onToggle, index }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      transition={{ delay: index * 0.04 }}
      className={`card overflow-hidden group transition-all duration-300 ${
        todo.is_completed ? 'opacity-60' : ''
      }`}
    >
      <button
        onClick={() => onToggle(todo.id)}
        className="flex items-center gap-4 w-full p-4 sm:p-5 text-left"
      >
        <div
          className={`w-6 h-6 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all duration-300 ${
            todo.is_completed
              ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-500 scale-110'
              : 'group-hover:border-accent border-[var(--border)]'
          }`}
          style={{
            boxShadow: todo.is_completed ? '0 0 12px rgba(34,197,94,0.35)' : 'none',
          }}
        >
          {todo.is_completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {todo.topic_name && (
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                {todo.topic_name}
              </span>
            )}
          </div>
          <span
            className={`text-sm block transition-all duration-300 ${
              todo.is_completed ? 'line-through opacity-60' : ''
            }`}
            style={{
              color: todo.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
            }}
          >
            {todo.content}
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {!todo.is_completed && (
            <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 px-2.5 py-1 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              Mark done
            </span>
          )}
          {todo.is_completed ? (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <FiCheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Done</span>
            </span>
          ) : (
            <FiClock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>
      </button>
    </motion.div>
  )
}

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchTodos = useCallback(async () => {
    try {
      const { data } = await client.get('/todos')
      const all = data.groups?.reduce((acc, g) => {
        const items = g.todos.map(t => ({ ...t, topic_name: g.topic, topic_id: g.topic_id }))
        return [...acc, ...items]
      }, []) || []
      setTodos(all)
    } catch {
      toast.error('Failed to load todos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  const toggleTodo = async (todoId) => {
    const prev = todos
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, is_completed: !t.is_completed } : t))
    try {
      await client.post(`/todos/${todoId}/toggle`)
    } catch {
      setTodos(prev)
      toast.error('Failed to update todo')
    }
  }

  if (loading) return <LoadingSpinner />

  const completed = todos.filter(t => t.is_completed).length
  const total = todos.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <FiList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Todos</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Track your learning tasks
            </p>
          </div>
        </div>
      </motion.div>

      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiTarget className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Progress
              </span>
            </div>
            <motion.div
              key={`${completed}-${total}`}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-medium tabular-nums"
              style={{ color: percentage === 100 ? '#22c55e' : 'var(--accent)' }}
            >
              {completed}/{total}
              <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>done</span>
            </motion.div>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: percentage === 100
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : 'linear-gradient(90deg, var(--accent), var(--primary-dark))',
              }}
              variants={progressVariants}
              initial="initial"
              animate="animate"
              custom={percentage}
            />
          </div>
        </motion.div>
      )}

      {todos.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {todos
              .sort((a, b) => (a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1))
              .map((todo, i) => (
                <TodoCard key={todo.id} todo={todo} onToggle={toggleTodo} index={i} />
              ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-16 text-center"
        >
          <FiList className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
            No todos yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Upload a document with todo sections to get started.
          </p>
        </motion.div>
      )}
    </div>
  )
}