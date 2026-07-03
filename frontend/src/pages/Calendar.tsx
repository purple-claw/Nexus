import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiChevronLeft, FiChevronRight,
  FiX, FiPlus
} from 'react-icons/fi'
import client from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [events, setEvents] = useState({})
  const [availableTopics, setAvailableTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignModal, setAssignModal] = useState(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, topicsRes] = await Promise.all([
        client.get('/calendar/events'),
        client.get('/calendar/available'),
      ])
      setEvents(eventsRes.data)
      setAvailableTopics(topicsRes.data.topics || [])
    } catch {
      toast.error('Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const calendarDays = useMemo(() => {
    const days = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }, [daysInMonth, firstDayOfMonth])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  const formatDate = (day) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<number>>(new Set())

  const toggleTopic = (id: number) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAssign = async () => {
    if (!assignModal || selectedTopicIds.size === 0) return
    try {
      await client.post('/calendar/assign', {
        topic_ids: Array.from(selectedTopicIds),
        date: assignModal.date,
      })
      toast.success(`${selectedTopicIds.size} topic${selectedTopicIds.size > 1 ? 's' : ''} assigned!`)
      setAssignModal(null)
      setSelectedTopicIds(new Set())
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Calendar</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Plan your study schedule</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={prevMonth} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Previous month"
          >
            <FiChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="Next month"
          >
            <FiChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
          {DAYS.map(day => (
            <div key={day} className="px-2 py-3 text-center text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="aspect-square" />
            const dateStr = formatDate(day)
            const isToday = dateStr === today.toISOString().slice(0, 10)
            const dayEvents = events[dateStr]

            return (
              <div
                key={day}
                className="aspect-square p-1 border-b border-r relative group"
                style={{ borderColor: 'var(--border)' }}
              >
                <button
                  onClick={() => { setAssignModal({ date: dateStr }); setSelectedTopicIds(new Set()) }}
                  className={`w-full h-full rounded-lg flex flex-col items-center justify-center transition-colors ${
                    isToday ? 'ring-2 ring-sky-500/50' : ''
                  }`}
                  style={{
                    background: dayEvents ? 'var(--accent-light)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!dayEvents) e.currentTarget.style.background = 'var(--bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (!dayEvents) e.currentTarget.style.background = 'transparent'
                  }}
                  aria-label={`${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${dayEvents ? `, ${dayEvents.topics} topic${dayEvents.topics > 1 ? 's' : ''}` : ''}`}
                >
                  <span className={`text-sm font-medium ${isToday ? 'text-sky-500' : ''}`}
                    style={{ color: dayEvents ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {day}
                  </span>
                  {dayEvents && (
                    <span className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
                      {dayEvents.topics} topic{dayEvents.topics > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'var(--overlay)' }}
            onClick={() => setAssignModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Assign Topic
                </h3>
                <button
                  onClick={() => setAssignModal(null)}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  aria-label="Close assign modal"
                >
                  <FiX className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Assign a topic to {new Date(assignModal.date).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric'
                })}
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1 mb-4">
                {availableTopics.map(t => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopicIds.has(t.id)}
                      onChange={() => toggleTopic(t.id)}
                      className="w-4 h-4 rounded accent-sky-500"
                    />
                    <span className="text-sm">{t.title}</span>
                  </label>
                ))}
                {availableTopics.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                    No topics available
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setAssignModal(null)} className="btn btn-ghost">Cancel</button>
                <button
                  onClick={handleAssign}
                  disabled={selectedTopicIds.size === 0}
                  className="btn btn-primary"
                >
                  <FiPlus className="w-4 h-4" />
                  {selectedTopicIds.size > 0 ? `Assign (${selectedTopicIds.size})` : 'Assign'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
