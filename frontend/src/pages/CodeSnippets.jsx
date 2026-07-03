import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import { useToast } from '../context/ToastContext'

export default function CodeSnippets() {
  const { toast } = useToast()
  const [snippets, setSnippets] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get('/reading/code')
      .then(r => setSnippets(r.data))
      .catch(() => toast.error('Failed to load code snippets'))
      .finally(() => setLoading(false))
  }, [])

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
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Code Snippets</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Code examples extracted from your reading materials
        </p>
      </div>

      {snippets.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No code snippets found. Upload a document to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {snippets.map((snippet, index) => (
              <motion.div
                key={snippet.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="card overflow-hidden"
                style={{
                  boxShadow: expandedId === snippet.id ? '0 0 30px rgba(59, 130, 246, 0.15)' : undefined,
                }}
              >
                <button
                  onClick={() => toggleExpand(snippet.id)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        {snippet.topic_title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-code)', color: 'var(--text-secondary)' }}>
                        {snippet.language}
                      </span>
                    </div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {snippet.title || 'Untitled Code'}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedId === snippet.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedId === snippet.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => handleCopy(snippet.content)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                          >
                            Copy
                          </button>
                        </div>
                        <div className="mt-4 rounded-xl overflow-hidden">
                          <SyntaxHighlighter
                            language={snippet.language}
                            style={vscDarkPlus}
                            showLineNumbers
                            customStyle={{
                              margin: 0,
                              borderRadius: '0.75rem',
                              fontSize: '0.875rem',
                              background: '#0d1117',
                            }}
                          >
                            {snippet.content}
                          </SyntaxHighlighter>
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
