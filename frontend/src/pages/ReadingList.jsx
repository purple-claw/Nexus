import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiFileText, FiChevronRight } from 'react-icons/fi'
import client from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ReadingList() {
  const [texts, setTexts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const { data } = await client.get('/reading')
        setTexts(data)
      } catch (err) {
        console.error('Failed to load reading list', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTexts()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reading</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Browse your reading content</p>
      </motion.div>

      {texts.length > 0 ? (
        <div className="space-y-3">
          {texts.map((text, i) => (
            <motion.div
              key={text.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={`/reading/${text.id}`}
                className="card-hoverable flex items-center gap-4 p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shrink-0">
                  <FiFileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {text.title || 'Untitled'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {text.topic_title}
                  </p>
                </div>
                <FiChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FiFileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No reading content yet.
          </p>
        </div>
      )}
    </div>
  )
}
