import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'
import MarkdownRenderer from '../components/MarkdownRenderer'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import { useToast } from '../context/ToastContext'

export default function Formulas() {
  const { toast } = useToast()
  const [formulas, setFormulas] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get('/reading/formulas')
      .then(r => setFormulas(r.data))
      .catch(() => toast.error('Failed to load formulas'))
      .finally(() => setLoading(false))
  }, [toast])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Formulas</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Key formulas and equations from your study materials
        </p>
      </div>

      {formulas.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No formulas found. Upload a document to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {formulas.map((formula, index) => (
              <motion.div
                key={formula.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="card overflow-hidden"
                style={{
                  boxShadow: expandedId === formula.id ? '0 0 30px rgba(59, 130, 246, 0.15)' : undefined,
                }}
              >
                <button
                  onClick={() => toggleExpand(formula.id)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        {formula.topic_title}
                      </span>
                    </div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formula.title || 'Untitled Formula'}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedId === formula.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedId === formula.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => handleCopy(formula.content)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                          >
                            Copy
                          </button>
                        </div>
                        <div className="mt-4">
                          <MarkdownRenderer content={formula.content} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
