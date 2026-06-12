import { useEffect, useRef, useState } from 'react'

let mermaidInitPromise = null
let renderCounter = 0

const mermaidRenderQueue = []
let mermaidQueueRunning = false

async function drainMermaidQueue() {
  if (mermaidQueueRunning) return
  mermaidQueueRunning = true
  while (mermaidRenderQueue.length > 0) {
    const task = mermaidRenderQueue.shift()
    try { await task() } catch { }
  }
  mermaidQueueRunning = false
}

function enqueueMermaidRender(task) {
  mermaidRenderQueue.push(task)
  drainMermaidQueue()
}

async function ensureMermaid() {
  if (!mermaidInitPromise) {
    mermaidInitPromise = (async () => {
      const m = (await import('mermaid')).default
      m.initialize({
        startOnLoad: false,
        quiet: true,
        suppressErrorRendering: true,
        theme: 'base',
        themeVariables: {
          background: '#0f172a', primaryColor: '#38bdf8', primaryTextColor: '#0f172a',
          primaryBorderColor: '#7dd3fc', lineColor: '#38bdf8', secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a', mainBkg: '#1e3a5f', nodeBorder: '#38bdf8',
          clusterBkg: '#1e293b', clusterBorder: '#38bdf8', titleColor: '#f1f5f9',
          edgeLabelBackground: '#1e293b', nodeTextColor: '#e2e8f0', fontSize: '14px',
        },
        flowchart: { htmlLabels: true, curve: 'basis', padding: 20, nodeSpacing: 60, rankSpacing: 60, diagramPadding: 20 },
        fontFamily: 'Inter, system-ui, sans-serif',
      })
      return m
    })()
  }
  return mermaidInitPromise
}

function sanitizeMermaidCode(raw) {
  let chart = raw
    .replace(/```mermaid\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^[\s\n]+|[\s\n]+$/g, '')
    .trim()
  if (!chart) return ''

  const lines = chart.split('\n').map(l => l.trimEnd())
  const cleanedLines = []
  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith('%%')) continue
    line = line.replace(/[\u201C\u201D\u201E]/g, '').replace(/[\u2018\u2019\u201A]/g, '')
    line = line.replace(/\[([^\]]*)\]/g, (_, label) => {
      const clean = label.replace(/["'`]/g, '').replace(/[;:]/g, ' ').trim()
      return `[${clean}]`
    })
    line = line.replace(/\{([^}]*)\}/g, (_, label) => {
      if (line.trim().match(/^(graph|flowchart)\s/i)) return `{${label}}`
      const clean = label.replace(/["'`]/g, '').replace(/[;:]/g, ' ').trim()
      return `{${clean}}`
    })
    line = line.replace(/\(([^)]*)\)/g, (_, label) => {
      const clean = label.replace(/["'`]/g, '').replace(/[;:]/g, ' ').trim()
      return `(${clean})`
    })
    cleanedLines.push(line)
  }

  chart = cleanedLines.join('\n')
  const validStarts = ['graph', 'flowchart', 'sequencediagram', 'classdiagram', 'statediagram', 'erdiagram', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline']
  const firstLine = cleanedLines[0]?.trim().toLowerCase() || ''
  const hasValidStart = validStarts.some(s => firstLine.startsWith(s))
  if (!hasValidStart) {
    if (chart.includes('-->') || chart.includes('---') || chart.includes('-.->')) {
      chart = 'graph TD\n' + chart
    } else {
      return ''
    }
  }
  return chart
}

export default function MermaidBlock({ chart, className = '' }) {
  const containerRef = useRef(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!chart || !containerRef.current) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    const renderDiagram = async (attempt = 0) => {
      if (cancelled || !containerRef.current || !mountedRef.current) return
      setIsLoading(true)
      setError(null)

      await new Promise((resolve) => {
        enqueueMermaidRender(async () => {
          if (cancelled || !containerRef.current || !mountedRef.current) { resolve(); return }
          try {
            const mermaid = await ensureMermaid()
            const cleanChart = sanitizeMermaidCode(chart)
            if (!cleanChart) throw new Error('Empty or invalid diagram code after sanitization')

            renderCounter++
            const id = `mermaid-${renderCounter}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

            const renderPromise = mermaid.render(id, cleanChart)
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Mermaid render timeout (8s)')), 8000)
            )

            const { svg } = await Promise.race([renderPromise, timeoutPromise])

            if (cancelled || !containerRef.current || !mountedRef.current) { resolve(); return }

            const hasError = /error|Syntax error/i.test(svg)
            if (hasError) {
              if (attempt === 0) {
                setTimeout(() => { if (!cancelled && mountedRef.current) renderDiagram(1) }, 200)
                resolve(); return
              }
              setError('Invalid diagram syntax')
              resolve(); return
            }

            containerRef.current.innerHTML = svg
            const svgEl = containerRef.current.querySelector('svg')
            if (svgEl) {
              svgEl.removeAttribute('height')
              svgEl.style.maxWidth = '100%'
              svgEl.style.height = 'auto'
            }
          } catch (err) {
            if (!cancelled && mountedRef.current) {
              if (attempt === 0) {
                setTimeout(() => { if (!cancelled && mountedRef.current) renderDiagram(1) }, 200)
                resolve(); return
              }
              setError(err instanceof Error ? err.message : 'Render failed')
            }
          }
          resolve()
        })
      })

      if (!cancelled && mountedRef.current) setIsLoading(false)
    }

    const timer = setTimeout(() => renderDiagram(0), 80)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [chart])

  if (error) {
    return null
  }

  return (
    <div className={`my-4 rounded-xl overflow-x-auto ${className}`}
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '1.5rem' }}>
      {isLoading && (
        <div className="h-32 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
      )}
      <div
        ref={containerRef}
        className="flex justify-center items-center min-w-fit"
        style={{ display: isLoading ? 'none' : 'flex' }}
      />
    </div>
  )
}