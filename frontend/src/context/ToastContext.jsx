import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border"
              style={{
                background: 'var(--toast-bg)',
                borderColor: 'var(--border)',
                borderLeft: `4px solid ${
                  t.type === 'success' ? 'var(--success)' :
                  t.type === 'error' ? 'var(--danger)' :
                  'var(--accent)'
                }`,
              }}
            >
              {t.type === 'success' && <FiCheckCircle className="w-5 h-5 shrink-0 text-green-500" />}
              {t.type === 'error' && <FiAlertCircle className="w-5 h-5 shrink-0 text-red-500" />}
              {t.type === 'info' && <FiInfo className="w-5 h-5 shrink-0 text-sky-500" />}
              <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <FiX className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be within ToastProvider')
  return ctx
}
