import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  FiChevronLeft, FiBarChart2, FiList, FiCopy, FiCheckCircle,
} from 'react-icons/fi'
import client from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'
import LoadingSpinner from '../components/LoadingSpinner'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(t)
    }
  }, [copied])
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true) }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
      style={{
        background: copied ? 'rgba(34,197,94,0.15)' : 'var(--accent-light)',
        color: copied ? '#22c55e' : 'var(--accent)',
      }}
    >
      {copied ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const formulaTheme = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: 'transparent',
    padding: '0',
    margin: '0',
    border: 'none',
    boxShadow: 'none',
    borderRadius: 0,
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",Consolas,monospace',
    fontSize: '14px',
    lineHeight: '1.7',
  },
}

export default function ContentDetail() {
  const { type, id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      try {
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
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                    {data.title || 'Formula'}
                  </h2>
                  <CopyButton text={data.content} />
                </div>
                <div className="rounded-xl overflow-hidden" style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="p-5">
                    <SyntaxHighlighter
                      language="python"
                      style={formulaTheme}
                      showLineNumbers={(data.content || '').split('\n').length > 3}
                      wrapLines={false}
                      lineNumberStyle={{
                        color: '#858585',
                        minWidth: '2.75em',
                        paddingRight: '1.25em',
                        userSelect: 'none',
                        borderRight: '1px solid #404040',
                        marginRight: '0.85em',
                      }}
                      customStyle={{ margin: 0, borderRadius: 0, background: 'transparent' }}
                      codeTagProps={{ style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
                    >
                      {data.content}
                    </SyntaxHighlighter>
                  </div>
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