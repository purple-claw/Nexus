import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHelpCircle, FiPlay } from 'react-icons/fi'
import client from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../context/ToastContext'

const difficultyColors = {
  easy: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
  medium: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  hard: { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e' },
}

export default function MCQList() {
  const { toast } = useToast()
  const [mcqs, setMcqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMCQs = async () => {
      try {
        const { data } = await client.get('/mcqs')
        setMcqs(data)
      } catch {
        toast.error('Failed to load MCQs')
      } finally {
        setLoading(false)
      }
    }
    fetchMCQs()
  }, [toast])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>MCQs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {mcqs.length} questions available
          </p>
        </div>
        <Link to="/mcqs/practice" className="btn btn-primary">
          <FiPlay className="w-4 h-4" />
          Practice
        </Link>
      </motion.div>

      {mcqs.length > 0 ? (
        <div className="space-y-3">
          {mcqs.map((mcq, i) => {
            const diff = difficultyColors[mcq.difficulty] || difficultyColors.medium
            return (
              <motion.div
                key={mcq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      {mcq.question}
                    </p>
                    {mcq.topic_title && (
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {mcq.topic_title}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="badge"
                      style={{ background: diff.bg, color: diff.text }}
                    >
                      {mcq.difficulty}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FiHelpCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No MCQs yet. Upload a document with MCQ sections.
          </p>
        </div>
      )}
    </div>
  )
}
