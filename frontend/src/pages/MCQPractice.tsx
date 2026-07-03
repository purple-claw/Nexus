import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHelpCircle, FiRefreshCw, FiCheckCircle, FiXCircle, FiArrowLeft, FiBarChart2, FiPlay } from 'react-icons/fi'
import client from '../api/client'
import MCQQuestion from '../components/MCQQuestion'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../context/ToastContext'

export default function MCQPractice() {
  const { toast } = useToast()
  const [allMcqs, setAllMcqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState([])
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [revealedAnswer, setRevealedAnswer] = useState(null)

  useEffect(() => {
    const fetchMCQs = async () => {
      try {
        const { data } = await client.get('/mcqs')
        setAllMcqs(data)
      } catch {
        toast.error('Failed to load MCQs')
      } finally {
        setLoading(false)
      }
    }
    fetchMCQs()
  }, [toast])

  const shuffled = useMemo(() => {
    if (!allMcqs.length) return []
    const arr = [...allMcqs]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [allMcqs])

  const current = shuffled[currentIndex]

  const handleAnswer = useCallback(async (mcqId, isCorrect) => {
    setResults(prev => [...prev, { mcqId, isCorrect }])
    try {
      const { data } = await client.post(`/mcqs/${mcqId}/answer`, { is_correct: isCorrect })
      setRevealedAnswer(data.correctAnswer)
    } catch {
      toast.error('Failed to record answer')
    }
  }, [toast])

  const nextQuestion = () => {
    setRevealedAnswer(null)
    if (currentIndex < shuffled.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setSessionComplete(true)
    }
  }

  const restart = () => {
    setCurrentIndex(0)
    setResults([])
    setSessionComplete(false)
    setSessionStarted(false)
    setRevealedAnswer(null)
  }

  if (loading) return <LoadingSpinner />

  if (!sessionStarted) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <FiHelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>MCQ Practice</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Test your knowledge with {shuffled.length} random questions
          </p>
          {shuffled.length > 0 ? (
            <button onClick={() => setSessionStarted(true)} className="btn btn-primary btn-lg">
              <FiPlay className="w-4 h-4" />
              Start Practice Session
            </button>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No MCQs available.</p>
          )}
        </motion.div>
      </div>
    )
  }

  if (sessionComplete) {
    const correct = results.filter(r => r.isCorrect).length
    const total = results.length
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center"
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            percentage >= 70 ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gradient-to-br from-amber-400 to-orange-600'
          }`}>
            {percentage >= 70 ? (
              <FiCheckCircle className="w-8 h-8 text-white" />
            ) : (
              <FiBarChart2 className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Session Complete!</h1>
          <div className="text-4xl font-bold mb-2" style={{ color: percentage >= 70 ? '#22c55e' : '#f59e0b' }}>
            {percentage}%
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {correct} correct out of {total} questions
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#22c55e' }}>
              <FiCheckCircle className="w-4 h-4" />
              <span>{correct} Correct</span>
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>|</span>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#f43f5e' }}>
              <FiXCircle className="w-4 h-4" />
              <span>{total - correct} Incorrect</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={restart} className="btn btn-primary">
              <FiRefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link to="/mcqs" className="btn btn-ghost">
              <FiArrowLeft className="w-4 h-4" />
              Back to List
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Question {currentIndex + 1} of {shuffled.length}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {results.filter(r => r.isCorrect).length} correct
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent)' }}
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / shuffled.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
        >
          <MCQQuestion
            question={current}
            onAnswer={handleAnswer}
            revealedAnswer={revealedAnswer}
          />
        </motion.div>
      </AnimatePresence>

      {/* Next Button */}
      <AnimatePresence>
        {results.length > currentIndex && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex justify-end"
          >
            <button onClick={nextQuestion} className="btn btn-primary">
              {currentIndex < shuffled.length - 1 ? 'Next Question' : 'See Results'}
              <FiArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


