import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function MermaidBlock({ chart }) {
  const containerRef = useRef(null)
  const [error, setError] = useState(false)
  const { isDark } = useTheme()

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      if (!containerRef.current || !chart) return
      setError(false)
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          themeVariables: {
            primaryColor: isDark ? '#1e3a5f' : '#0ea5e9',
            primaryTextColor: '#fff',
            primaryBorderColor: isDark ? '#0ea5e9' : '#0284c7',
            lineColor: isDark ? '#38bdf8' : '#0ea5e9',
            secondaryColor: isDark ? '#1e293b' : '#f0f9ff',
            tertiaryColor: isDark ? '#0f172a' : '#ffffff',
            fontSize: '14px',
            fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
          },
        })
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const { svg } = await mermaid.render(id, chart)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (e) {
        if (!cancelled) {
          setError(true)
        }
      }
    }
    render()
    return () => { cancelled = true }
  }, [chart, isDark])

  if (error) {
    return (
      <div className="mermaid-wrapper">
        <p className="text-sm text-red-400">Failed to render diagram</p>
      </div>
    )
  }

  return (
    <div className="mermaid-wrapper">
      <div ref={containerRef} className="flex justify-center w-full" />
    </div>
  )
}
