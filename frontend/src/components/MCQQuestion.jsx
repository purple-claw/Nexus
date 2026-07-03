import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheck, FiX, FiChevronDown } from 'react-icons/fi'
import InlineMarkdown from './InlineMarkdown'

const difficultyColors = {
  easy: { badge: 'badge-success', text: 'Easy' },
  medium: { badge: 'badge-warning', text: 'Medium' },
  hard: { badge: 'badge-danger', text: 'Hard' },
}

export default function MCQQuestion({ question, onAnswer, disabled, revealedAnswer }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!question) return null

  let options = question.options || []
  if (typeof options === 'string') {
    try { options = JSON.parse(options) } catch { options = [] }
  }
  if (!Array.isArray(options)) options = []

  const diff = difficultyColors[question.difficulty] || difficultyColors.medium
  const correctAnswer = revealedAnswer || question.answer
  const isCorrect = selected === correctAnswer

  const handleSelect = async (key) => {
    if (answered || disabled || submitting) return
    setSelected(key)
    setAnswered(true)
    setSubmitting(true)
    await onAnswer?.(question.id, key === correctAnswer)
    setSubmitting(false)
  }

  const getOptionStyle = (key) => {
    if (!answered) return {}
    if (key === correctAnswer) {
      return {
        borderColor: '#22c55e',
        background: 'rgba(34,197,94,0.1)',
      }
    }
    if (key === selected && key !== correctAnswer) {
      return {
        borderColor: '#f43f5e',
        background: 'rgba(244,63,94,0.1)',
      }
    }
    return { opacity: 0.5 }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-base font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            <InlineMarkdown content={question.question} />
          </h3>
          <span className={`badge ${diff.badge} shrink-0 mt-0.5`}>{diff.text}</span>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {options.map((opt) => (
            <motion.button
              key={opt.key}
              whileTap={!answered ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(opt.key)}
              disabled={answered || disabled}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-150 text-left"
              style={{
                border: '2px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-primary)',
                ...getOptionStyle(opt.key),
              }}
              onMouseEnter={(e) => {
                if (!answered) {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.background = 'var(--accent-light)'
                }
              }}
              onMouseLeave={(e) => {
                if (!answered) {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: selected === opt.key ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: selected === opt.key ? '#fff' : 'var(--text-secondary)',
                }}>
                {opt.key}
              </span>
              <span className="flex-1"><InlineMarkdown content={opt.text} /></span>
              {answered && opt.key === correctAnswer && (
                <FiCheck className="w-5 h-5 text-green-500 shrink-0" />
              )}
              {answered && opt.key === selected && opt.key !== correctAnswer && (
                <FiX className="w-5 h-5 text-red-500 shrink-0" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Explanation */}
        {answered && question.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              <FiChevronDown className={`w-4 h-4 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
              {isCorrect ? 'Correct!' : 'Incorrect'} - {showExplanation ? 'Hide' : 'Show'} explanation
            </button>
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-2 p-3 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <InlineMarkdown content={question.explanation} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
