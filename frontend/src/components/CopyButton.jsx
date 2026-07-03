import { useState, useCallback } from 'react'
import { FiCopy, FiCheckCircle } from 'react-icons/fi'

export default function CopyButton({ text, className = '', showLabel = false }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${className}`}
      style={{
        background: copied ? 'rgba(34,197,94,0.15)' : 'var(--accent-light)',
        color: copied ? '#22c55e' : 'var(--accent)',
      }}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
      {showLabel ? (copied ? 'Copied' : 'Copy') : null}
    </button>
  )
}
