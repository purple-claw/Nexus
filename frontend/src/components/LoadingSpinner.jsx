import { motion } from 'framer-motion'

export default function LoadingSpinner({ fullPage = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        className="w-8 h-8 border-2 rounded-full"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[1,2,3].map(i => (
          <div key={i} className="card p-6">
            <div className="skeleton h-4 w-20 mb-3" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="card p-6 mt-4">
        <div className="skeleton h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-6">
          <div className="skeleton h-4 w-20 mb-3" />
          <div className="skeleton h-8 w-16 mb-2" />
          <div className="skeleton h-3 w-32" />
        </div>
      ))}
    </div>
  )
}
