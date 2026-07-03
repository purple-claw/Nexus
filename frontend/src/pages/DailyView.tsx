import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiTarget, FiBook, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import client from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../context/ToastContext'

export default function DailyView() {
  const { toast } = useToast()
  const { date: paramDate } = useParams()
  const [date, setDate] = useState(paramDate || new Date().toISOString().slice(0, 10))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (paramDate) setDate(paramDate)
  }, [paramDate])

  useEffect(() => {
    const fetchDaily = async () => {
      setLoading(true)
      try {
        const { data: res } = await client.get(`/daily/${date}`)
        setData(res)
      } catch {
        toast.error('Failed to load daily plan')
      } finally {
        setLoading(false)
      }
    }
    fetchDaily()
  }, [date, toast])

  const prevDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().slice(0, 10))
  }

  const nextDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().slice(0, 10))
  }

  const isToday = date === new Date().toISOString().slice(0, 10)

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Date Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button onClick={prevDay} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isToday ? 'Today' : new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button onClick={nextDay} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {data?.topics?.length > 0 ? (
        <div className="space-y-4">
          {data.topics.map((topic, i) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/topics/${topic.id}`} className="card-hoverable block p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0">
                    <FiBook className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {topic.title}
                    </h2>
                    {topic.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <FiTarget className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No topics scheduled for this day.
          </p>
          <Link to="/calendar" className="btn btn-primary mt-4">
            Plan Your Schedule
          </Link>
        </motion.div>
      )}
    </div>
  )
}
