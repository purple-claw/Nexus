import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiList, FiCheckSquare, FiRotateCcw, FiChevronRight,
  FiBook, FiTarget, FiCheckCircle,
} from 'react-icons/fi'
import client from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

function TodoItem({ todo, onToggle }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onToggle(todo.id)}
      className="flex items-center gap-3.5 w-full px-5 py-3.5 text-left transition-all duration-200 group"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div
        className={`w-5 h-5 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all duration-300 ${
          todo.is_completed
            ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-500 scale-110'
            : 'group-hover:border-accent'
        }`}
        style={{
          borderColor: todo.is_completed ? 'transparent' : 'var(--border)',
          boxShadow: todo.is_completed ? '0 0 8px rgba(34,197,94,0.3)' : 'none',
        }}
      >
        {todo.is_completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
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
      {!todo.is_completed && (
        <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
          Done
        </span>
      )}
      {todo.is_completed && (
        <FiCheckCircle className="w-4 h-4 shrink-0" style={{ color: '#22c55e' }} />
      )}
    </motion.button>
  )
}

export default function Todos() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchTodos = async () => {
    try {
      const { data } = await client.get('/todos')
      setGroups(data.groups || [])
    } catch {
      console.error('Failed to load todos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTodos() }, [])

  const toggleTodo = async (todoId) => {
    try {
      await client.post(`/todos/${todoId}/toggle`)
      toast.success('Todo updated')
      fetchTodos()
    } catch {
      toast.error('Failed to update todo')
    }
  }

  if (loading) return <LoadingSpinner />

  const allTodos = groups.reduce((acc, g) => [...acc, ...g.todos], [])
  const completed = allTodos.filter(t => t.is_completed).length
  const total = allTodos.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
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
            <span className="text-sm font-medium" style={{ color: percentage === 100 ? '#22c55e' : 'var(--accent)' }}>
              {completed}/{total}
              <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>done</span>
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: percentage === 100
                  ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                  : `linear-gradient(90deg, var(--accent), var(--primary-dark))`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}

      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group, gi) => {
            const groupCompleted = group.todos.filter(t => t.is_completed).length
            const groupTotal = group.todos.length
            return (
              <motion.div
                key={group.topic}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + gi * 0.04 }}
                className="card overflow-hidden"
              >
                <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0">
                      <FiBook className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/topics/${group.topic_id}`}
                        className="text-sm font-semibold truncate block hover:underline"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {group.topic}
                      </Link>
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {groupCompleted}/{groupTotal} tasks
                      </span>
                    </div>
                  </div>
                  <FiChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {group.todos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
                  ))}
                </div>
              </motion.div>
            )
          })}
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