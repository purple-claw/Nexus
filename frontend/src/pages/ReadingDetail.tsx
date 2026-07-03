import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiChevronLeft, FiFileText } from 'react-icons/fi'
import client from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ReadingDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchReading = async () => {
      try {
        const { data: res } = await client.get(`/reading/${id}`)
        setData(res)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchReading()
  }, [id])

  if (loading) return <LoadingSpinner />

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--text-tertiary)' }}>Reading not found</p>
        <Link to="/reading" className="btn btn-primary mt-4">Back to Reading</Link>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-4"
      >
        <Link
          to="/reading"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to Reading
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
            <FiFileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.title || 'Untitled'}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{data.topic_title}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card overflow-hidden"
      >
        <div className="p-6">
          <MarkdownRenderer content={data.content} />
        </div>
      </motion.div>
    </div>
  )
}
