import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'system-ui, -apple-system, sans-serif',
})

export default function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref.current || !chart) return
    setError(null)
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg
      })
      .catch((err: Error) => {
        setError(err.message)
      })
  }, [chart])

  if (error) {
    return (
      <div className="my-4 p-4 rounded-xl text-sm font-mono whitespace-pre-wrap"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
        <div className="text-xs font-semibold mb-2" style={{ color: '#f43f5e' }}>Mermaid error:</div>
        {chart}
      </div>
    )
  }

  return (
    <div className="my-4 flex justify-center overflow-x-auto" ref={ref} />
  )
}
