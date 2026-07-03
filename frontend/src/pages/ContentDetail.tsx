import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiChevronLeft, FiBarChart2, FiList,
} from 'react-icons/fi'
import client from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'
import CopyButton from '../components/CopyButton'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ContentDetail() {
  const { type, id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        if (type !== 'formula' && type !== 'note') {
          setError(true)
          return
        }
        const endpoint = type === 'formula' ? `/reading/formula/${id}` : `/reading/note/${id}`
        const { data: res } = await client.get(endpoint)
        setData(res)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [type, id])

  if (loading) return <LoadingSpinner />
  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--text-tertiary)' }}>Content not found</p>
        <Link to="/reading" className="btn btn-primary mt-4">Back to Reading</Link>
      </div>
    )
  }

  const isFormula = type === 'formula'
  const gradient = isFormula
    ? 'from-amber-400 to-orange-600'
    : 'from-emerald-400 to-teal-600'
  const Icon = isFormula ? FiBarChart2 : FiList
  const iconBg = isFormula ? 'shadow-lg shadow-orange-500/20' : 'shadow-lg shadow-emerald-500/20'

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-4"
      >
        <Link
          to="/reading"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 group"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <FiChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to Reading
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center ${iconBg}`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {isFormula ? (data.title || 'Formula') : 'Note'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {data.topic_title}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isFormula ? (
          <div className="card overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 rounded-[1rem] bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
              <div className="p-5 sm:p-8 relative">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                      <FiBarChart2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                      {data.title || 'Formula'}
                    </h2>
                  </div>
                  <CopyButton text={data.content} showLabel />
                </div>
                <div className="prose max-w-none text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <MarkdownRenderer content={data.content} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="p-5 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0">
                  <FiList className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Note
                </span>
              </div>
              <div className="prose max-w-none" style={{ color: 'var(--text-secondary)' }}>
                <MarkdownRenderer content={data.content} />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}