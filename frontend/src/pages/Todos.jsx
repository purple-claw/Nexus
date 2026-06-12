import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiList, FiCheckSquare, FiRotateCcw } from 'react-icons/fi'
import client from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Todos() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchTodos = async () => {
    try {
      const { data } = await client.get('/todos')
      setGroups(data.groups || [])
    } catch (err) {
      console.error('Failed to load todos', err)
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
    } catch (err) {
      toast.error('Failed to update todo')
    }
  }

  if (loading) return <LoadingSpinner />

  const allTodos = groups.reduce((acc, g) => [...acc, ...g.todos], [])
  const completed = allTodos.filter(t => t.is_completed).length
  const total = allTodos.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Todos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Track your learning tasks
        </p>
      </motion.div>

      {/* Progress */}
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Progress
            </span>
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {completed}/{total} completed
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: percentage === 100 ? '#22c55e' : 'var(--accent)' }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}

      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <motion.div
              key={group.topic}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
              className="card overflow-hidden"
            >
              <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <FiCheckSquare className="w-4 h-4 inline mr-2" />
                  {group.topic}
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {group.todos.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => toggleTodo(todo.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                        todo.is_completed
                          ? 'bg-green-500 border-green-500'
                          : ''
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
                      className={`text-sm flex-1 ${todo.is_completed ? 'line-through' : ''}`}
                      style={{
                        color: todo.is_completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      }}
                    >
                      {todo.content}
                    </span>
                    {!todo.is_completed && (
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Mark done</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FiList className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No todos yet. Upload a document with todo sections.
          </p>
        </div>
      )}
    </div>
  )
}
