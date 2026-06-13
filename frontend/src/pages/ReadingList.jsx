import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiFileText, FiBookOpen } from 'react-icons/fi'
import client from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import MarkdownRenderer from '../components/MarkdownRenderer'

export default function ReadingList() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/reading')
      .then(r => setReadings(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
            <FiBookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reading</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Read through your study materials
            </p>
          </div>
        </div>
      </motion.div>

      {readings.length > 0 ? (
        <div className="space-y-3">
          {readings.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/reading/${item.id}`}
                className="card-hoverable block p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                  >
                    Reading
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {item.topic_title}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {item.title || 'Untitled'}
                </h3>
                <div className="text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                  <MarkdownRenderer content={(item.content || '').slice(0, 300)} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FiFileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No reading content yet. Upload a document to get started.
          </p>
        </div>
      )}
    </div>
  )
}
