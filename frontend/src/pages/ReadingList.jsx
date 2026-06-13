import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiFileText, FiBarChart2, FiList, FiChevronRight,
  FiBookOpen, FiCode,
} from 'react-icons/fi'
import client from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: 'Reading', icon: FiFileText },
  { id: 'formula', label: 'Formulas', icon: FiBarChart2 },
  { id: 'note', label: 'Notes', icon: FiList },
  { id: 'code', label: 'Code', icon: FiCode },
]

function extractCodeSnippets(content) {
  const snippets = []
  const regex = /```(\w*)\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(content)) !== null) {
    snippets.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    })
  }
  return snippets
}

function ContentCard({ item }) {
  const iconMap = {
    reading: <FiFileText className="w-5 h-5 text-white" />,
    formula: <FiBarChart2 className="w-5 h-5 text-white" />,
    note: <FiList className="w-5 h-5 text-white" />,
  }
  const gradientMap = {
    reading: 'from-violet-400 to-purple-600',
    formula: 'from-amber-400 to-orange-600',
    note: 'from-emerald-400 to-teal-600',
    code: 'from-cyan-400 to-blue-600',
  }

  const content = item.type === 'code' ? item.code : (item.content || '')
  const preview = content.replace(/[#*`\[\]]/g, '').slice(0, 120).trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        to={item.linkTo}
        className="card-hoverable flex items-start gap-4 p-4"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientMap[item.type]} flex items-center justify-center shrink-0 mt-0.5`}>
          {iconMap[item.type] || <FiBookOpen className="w-5 h-5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              {item.type}
            </span>
            {item.type === 'code' && item.language && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}>
                {item.language}
              </span>
            )}
          </div>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {item.title || 'Untitled'}
          </p>
          {preview && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
              {preview}{content.length > 120 ? '...' : ''}
            </p>
          )}
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            {item.topic_title}
          </p>
        </div>
        <FiChevronRight className="w-4 h-4 shrink-0 mt-2" style={{ color: 'var(--text-tertiary)' }} />
      </Link>
    </motion.div>
  )
}

export default function ReadingList() {
  const [readings, setReadings] = useState([])
  const [formulas, setFormulas] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const rRes = await client.get('/reading').catch(() => null)
        setReadings(rRes?.data || [])
      } catch {}
      try {
        const fRes = await client.get('/reading/formulas').catch(() => null)
        setFormulas(fRes?.data || [])
      } catch {}
      try {
        const nRes = await client.get('/reading/notes').catch(() => null)
        setNotes(nRes?.data || [])
      } catch {}
      setLoading(false)
    }
    fetchAll()
  }, [])

  const items = useMemo(() => {
    const result = []

    for (const r of readings) {
      result.push({
        type: 'reading',
        id: `r-${r.id}`,
        title: r.title || 'Untitled',
        content: r.content || '',
        topic_title: r.topic_title,
        linkTo: `/reading/${r.id}`,
      })
    }

    for (const f of formulas) {
      result.push({
        type: 'formula',
        id: `f-${f.id}`,
        title: f.title || 'Untitled Formula',
        content: f.content || '',
        topic_title: f.topic_title,
        linkTo: `/reading/item/formula/${f.id}`,
      })
    }

    for (const n of notes) {
      result.push({
        type: 'note',
        id: `n-${n.id}`,
        title: n.content ? n.content.slice(0, 60).trim() : 'Untitled Note',
        content: n.content || '',
        topic_title: n.topic_title,
        linkTo: `/reading/item/note/${n.id}`,
      })
    }

    for (const r of readings) {
      const snippets = extractCodeSnippets(r.content || '')
      for (let i = 0; i < snippets.length; i++) {
        result.push({
          type: 'code',
          id: `c-${r.id}-${i}`,
          title: snippets[i].language
            ? `${snippets[i].language.toUpperCase()} snippet`
            : 'Code snippet',
          code: snippets[i].code,
          language: snippets[i].language,
          content: snippets[i].code,
          topic_title: r.topic_title,
          linkTo: `/reading/${r.id}`,
        })
      }
    }

    return result
  }, [readings, formulas, notes])

  const displayed = useMemo(() => {
    if (filter === 'all') return items
    return items.filter(i => i.type === filter)
  }, [items, filter])

  const counts = useMemo(() => {
    const c = { all: items.length }
    for (const i of items) {
      c[i.type] = (c[i.type] || 0) + 1
    }
    return c
  }, [items])

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
              Browse all reading content, formulas, code snippets, and notes
            </p>
          </div>
        </div>
      </motion.div>

      {items.length > 0 ? (
        <>
          <div className="flex gap-1 mb-4 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--bg-elevated)' }}>
            {FILTERS.map((f) => {
              const Icon = f.icon
              const isActive = filter === f.id
              const count = counts[f.id]
              if (!count && f.id !== 'all') return null
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive ? 'shadow-sm' : ''}`}
                  style={{
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {f.label}
                  <span className="text-xs opacity-60">({count || 0})</span>
                </button>
              )
            })}
          </div>

          <div className="space-y-3">
            {displayed.map((item, i) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <FiFileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No content yet. Upload a document to get started.
          </p>
        </div>
      )}
    </div>
  )
}