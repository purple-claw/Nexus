import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiBook, FiChevronRight, FiFolder, FiChevronDown } from 'react-icons/fi'
import client from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

function TopicCard({ topic }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        to={`/topics/${topic.id}`}
        className="card-hoverable flex items-center gap-4 p-4"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0">
          <FiBook className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {topic.title}
          </p>
          {topic.description && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
              {topic.description}
            </p>
          )}
        </div>
        <FiChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
      </Link>
    </motion.div>
  )
}

function CategorySection({ category, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)

  if (!category.topics?.length && !category.children?.length) return null

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-lg transition-colors"
        style={{ color: 'var(--text-primary)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <FiChevronDown
          className={`w-4 h-4 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
          style={{ color: 'var(--text-tertiary)' }}
        />
        <FiFolder className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <span className="text-sm font-medium">{category.name}</span>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
          {category.topics?.length || 0} topics
        </span>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="ml-6 mt-2 space-y-2"
        >
          {category.topics?.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
          {category.children?.map((child) => (
            <CategorySection key={child.name} category={child} defaultOpen={false} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default function Library() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const { data } = await client.get('/library')
        setCategories(data.categories || [])
      } catch (err) {
        console.error('Failed to load library', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLibrary()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Library</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Browse your topics by category</p>
      </motion.div>

      {categories.length > 0 ? (
        <div className="card divide-y" style={{ borderColor: 'var(--border)' }}>
          {categories.map((cat, i) => (
            <CategorySection key={cat.name} category={cat} defaultOpen={i === 0} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FiBook className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No topics yet. Upload a document to get started.
          </p>
        </div>
      )}
    </div>
  )
}
