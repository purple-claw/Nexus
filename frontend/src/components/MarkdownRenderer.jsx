import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import MermaidBlock from './MermaidBlock'
import { FiCopy, FiCheck, FiCode, FiChevronDown, FiChevronUp } from 'react-icons/fi'

const PROGRESSIVE_THRESHOLD = 60000
const LARGE_CODE_LINES = 400
const CODE_PREVIEW_LINES = 50

const MATH_LANGUAGES = new Set(['math', 'latex', 'tex', 'katex'])

function normalizeMathSource(source) {
  let s = source.trim()
  if (s.startsWith('$$') && s.endsWith('$$')) return s.slice(2, -2).trim()
  if (s.startsWith('$') && s.endsWith('$')) return s.slice(1, -1).trim()
  if (s.startsWith('\\(') && s.endsWith('\\)')) return s.slice(2, -2).trim()
  if (s.startsWith('\\[') && s.endsWith('\\]')) return s.slice(2, -2).trim()
  return s
}

function preprocessMathDelimiters(content) {
  const fenceRegex = /^\s*(```|~~~)/
  const inlineCodeRegex = /(`+)([^`]*?)\1/g

  const convertSegment = (segment) => {
    const stash = []
    const protectedSegment = segment.replace(inlineCodeRegex, (match) => {
      const key = `__INLINE_CODE_${stash.length}__`
      stash.push(match)
      return key
    })
    let replaced = protectedSegment
      .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, inner) => `$$${inner}$$`)
      .replace(/\\\(((?:.|\n)*?)\\\)/g, (_, inner) => `$${inner}$`)
    stash.forEach((value, idx) => {
      replaced = replaced.replace(`__INLINE_CODE_${idx}__`, value)
    })
    return replaced
  }

  const lines = content.split('\n')
  let inFence = false
  let buffer = ''
  let output = ''

  const flushBuffer = () => {
    if (!buffer) return
    output += convertSegment(buffer)
    buffer = ''
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (fenceRegex.test(line)) {
      flushBuffer()
      inFence = !inFence
      output += line
    } else if (inFence) {
      output += line
    } else {
      buffer += line
    }
    if (i < lines.length - 1) {
      output += inFence ? '\n' : ''
      buffer += inFence ? '' : '\n'
    }
  }

  flushBuffer()
  return output
}

function renderKatexHtml(value, displayMode) {
  try {
    try {
      return katex.renderToString(value, { displayMode, throwOnError: true, strict: 'ignore' })
    } catch {
      return katex.renderToString(value, { displayMode, throwOnError: false, strict: 'ignore' })
    }
  } catch {
    return ''
  }
}

function prefersDisplayMath(src) {
  const s = src.trim()
  if (!s) return false
  if (s.includes('\n') || /\\begin\{/.test(s) || s.includes('&') || s.includes('\\displaystyle')) return true
  if (/\\(int|sum|prod|lim|frac|partial|nabla)/.test(s)) return true
  if (/\\frac\s*\{\s*d|d\/d|\\partial/.test(s)) return true
  if (s.length > 120) return true
  return false
}

const languageLabels = {
  js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
  tsx: 'TypeScript React', jsx: 'JavaScript React', py: 'Python', python: 'Python',
  rb: 'Ruby', ruby: 'Ruby', go: 'Go', rust: 'Rust', rs: 'Rust',
  java: 'Java', kotlin: 'Kotlin', kt: 'Kotlin', swift: 'Swift',
  c: 'C', cpp: 'C++', 'c++': 'C++', cs: 'C#', csharp: 'C#',
  php: 'PHP', html: 'HTML', css: 'CSS', scss: 'SCSS', sass: 'Sass',
  less: 'Less', json: 'JSON', yaml: 'YAML', yml: 'YAML', xml: 'XML',
  sql: 'SQL', bash: 'Bash', sh: 'Shell', shell: 'Shell',
  powershell: 'PowerShell', ps1: 'PowerShell',
  markdown: 'Markdown', md: 'Markdown',
  docker: 'Dockerfile', dockerfile: 'Dockerfile',
  graphql: 'GraphQL', vue: 'Vue', svelte: 'Svelte',
}

const vscodeTheme = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: '#1E1E1E', borderRadius: '0', padding: '16px', margin: '0', border: 'none', boxShadow: 'none',
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",Consolas,monospace',
    fontSize: '13px', lineHeight: '1.6', textShadow: 'none',
  },
  comment: { color: '#6A9955', fontStyle: 'italic' },
  prolog: { color: '#6A9955' }, doctype: { color: '#6A9955' }, cdata: { color: '#6A9955' },
  punctuation: { color: '#D4D4D4' }, property: { color: '#9CDCFE' }, tag: { color: '#569CD6' },
  boolean: { color: '#569CD6' }, number: { color: '#B5CEA8' }, constant: { color: '#4FC1FF' },
  symbol: { color: '#B5CEA8' }, deleted: { color: '#CE9178' }, selector: { color: '#D7BA7D' },
  'attr-name': { color: '#9CDCFE' }, string: { color: '#CE9178' }, char: { color: '#CE9178' },
  builtin: { color: '#4EC9B0' }, inserted: { color: '#B5CEA8' }, operator: { color: '#D4D4D4' },
  entity: { color: '#4EC9B0', cursor: 'help' }, url: { color: '#4EC9B0' }, variable: { color: '#9CDCFE' },
  atrule: { color: '#C586C0' }, 'attr-value': { color: '#CE9178' }, function: { color: '#DCDCAA' },
  'class-name': { color: '#4EC9B0' }, keyword: { color: '#C586C0' }, regex: { color: '#D16969' },
  important: { color: '#569CD6', fontWeight: 'bold' },
}

const MathInline = memo(function MathInline({ value }) {
  const html = renderKatexHtml(value, false)
  if (!html) return <span className="math-inline" style={{ color: 'var(--text-secondary)' }}>{value}</span>
  return <span className="math-inline" dangerouslySetInnerHTML={{ __html: html }} />
})

const MathBlock = memo(function MathBlock({ value }) {
  const useDisplay = prefersDisplayMath(value)
  const html = renderKatexHtml(value, useDisplay)
  if (!html) {
    return <pre className="my-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--text-secondary)' }}>{value}</pre>
  }
  if (useDisplay) {
    return <div className="math-display-wrapper my-4" dangerouslySetInnerHTML={{ __html: html }} />
  }
  return <span className="math-inline" dangerouslySetInnerHTML={{ __html: html }} />
})

const LazyHighlighter = memo(function LazyHighlighter({ language, value, lineCount }) {
  const [highlighted, setHighlighted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setHighlighted(true))
    return () => cancelAnimationFrame(id)
  }, [value, language])
  if (!highlighted) {
    return (
      <pre className="m-0 p-4 text-[13px] leading-[1.6] font-mono overflow-auto whitespace-pre"
        style={{ background: '#1E1E1E', color: '#D4D4D4' }}>
        {value}
      </pre>
    )
  }
  return (
    <SyntaxHighlighter
      language={language || 'text'}
      style={vscodeTheme}
      showLineNumbers={lineCount > 3}
      wrapLines={false}
      lineNumberStyle={{
        color: '#858585', minWidth: '2.75em', paddingRight: '1.25em',
        userSelect: 'none', borderRight: '1px solid #404040', marginRight: '0.85em',
      }}
      customStyle={{ margin: 0, borderRadius: 0, background: '#1E1E1E', width: 'max-content', minWidth: '100%' }}
      codeTagProps={{ style: { whiteSpace: 'pre' } }}
    >
      {value}
    </SyntaxHighlighter>
  )
})

const CodeBlock = memo(function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const normalizedLanguage = language?.toLowerCase() ?? ''

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  if (language === 'mermaid') return <MermaidBlock chart={value} />

  if (MATH_LANGUAGES.has(normalizedLanguage)) return <MathBlock value={normalizeMathSource(value)} />

  const displayLanguage = languageLabels[language?.toLowerCase()] ?? language?.toUpperCase() ?? 'TEXT'
  const lines = value.split('\n')
  const lineCount = lines.length
  const isLarge = lineCount > LARGE_CODE_LINES
  const displayValue = isLarge && !expanded ? lines.slice(0, CODE_PREVIEW_LINES).join('\n') : value

  return (
    <div className="relative my-4 min-w-0 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#252526' }}>
        <div className="flex min-w-0 items-center gap-2">
          <FiCode size={14} className="shrink-0" style={{ color: 'var(--accent)' }} />
          <span className="truncate text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{displayLanguage}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[10px] sm:inline" style={{ color: 'var(--text-tertiary)' }}>
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            {copied ? <FiCheck size={12} style={{ color: '#22c55e' }} /> : <FiCopy size={12} />}
            <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <div className="overflow-auto max-h-[55dvh] sm:max-h-[62dvh]" style={{ scrollbarWidth: 'thin' }}>
        <LazyHighlighter language={language} value={displayValue} lineCount={lineCount} />
      </div>
      {isLarge && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex w-full items-center justify-center gap-1.5 py-2 text-xs transition-colors"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#1E1E1E', color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
        >
          {expanded ? <><FiChevronUp size={13} /> Collapse</> : <><FiChevronDown size={13} /> Show all {lineCount} lines</>}
        </button>
      )}
    </div>
  )
})

const MD_COMPONENTS = {
  code({ node, inline, className, children, ...props }) {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded text-[0.82em] font-mono"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }} {...props}>
          {children}
        </code>
      )
    }
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    const value = Array.isArray(children)
      ? children.map(child => (typeof child === 'string' ? child : '')).join('')
      : typeof children === 'string' ? children : String(children ?? '')
    return <CodeBlock language={language} value={value.replace(/\n$/, '')} />
  },
  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5 first:mt-0" style={{ color: 'var(--text-primary)' }}>{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0" style={{ color: 'var(--text-primary)' }}>{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0" style={{ color: 'var(--text-primary)' }}>{children}</h4>,
  p: ({ children }) => <p className="leading-relaxed mb-4 last:mb-0" style={{ color: 'var(--text-secondary)' }}>{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="underline underline-offset-2 transition-colors"
      style={{ color: 'var(--accent)' }}
      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}>
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-4 list-disc list-outside space-y-1.5 pl-5 last:mb-0" style={{ color: 'var(--text-secondary)' }}>{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal list-outside space-y-1.5 pl-5 last:mb-0" style={{ color: 'var(--text-secondary)' }}>{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="pl-4 py-0.5 my-4 rounded-r-lg"
      style={{ borderLeft: '4px solid var(--accent)', background: 'var(--accent-light)' }}>
      <div className="italic" style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full min-w-max text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead style={{ background: 'var(--bg-elevated)' }}>{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>{children}</tbody>,
  tr: ({ children }) => <tr className="transition-colors" style={{ hover: { background: 'var(--bg-hover)' } }}>{children}</tr>,
  th: ({ children }) => <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</th>,
  td: ({ children }) => <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{children}</td>,
  hr: () => <hr className="border-0 h-px my-6" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />,
  img: ({ src, alt }) => (
    <figure className="my-4">
      <img src={src} alt={alt} loading="lazy" decoding="async" className="rounded-xl max-w-full h-auto" style={{ border: '1px solid var(--border)' }} />
      {alt && <figcaption className="text-center text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{alt}</figcaption>}
    </figure>
  ),
  del: ({ children }) => <del className="line-through" style={{ color: 'var(--text-tertiary)' }}>{children}</del>,
  strong: ({ children }) => <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</strong>,
  em: ({ children }) => <em className="italic" style={{ color: 'var(--text-primary)' }}>{children}</em>,
  inlineMath: ({ value }) => value ? <MathInline value={value} /> : null,
  math: ({ value }) => value ? <MathBlock value={value} /> : null,
}

const REMARK_PLUGINS = [remarkGfm, remarkMath]

function splitContent(text, maxChunkSize) {
  const chunks = []
  let remaining = text
  while (remaining.length > maxChunkSize) {
    const searchArea = remaining.slice(0, maxChunkSize)
    let headMatch = searchArea.search(/\n(?=#{1,3} )/)
    let splitAt = headMatch > maxChunkSize / 3 ? headMatch : -1
    if (splitAt < 0) {
      const paraIdx = remaining.lastIndexOf('\n\n', maxChunkSize)
      splitAt = paraIdx > 0 ? paraIdx + 2 : maxChunkSize
    }
    chunks.push(remaining.slice(0, splitAt))
    remaining = remaining.slice(splitAt)
  }
  if (remaining) chunks.push(remaining)
  return chunks
}

const MarkdownChunk = memo(function MarkdownChunk({ content }) {
  const preprocessed = preprocessMathDelimiters(content)
  return <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MD_COMPONENTS}>{preprocessed}</ReactMarkdown>
}, (prev, next) => prev.content === next.content)

const ProgressiveMarkdown = memo(function ProgressiveMarkdown({ chunks }) {
  const [visibleCount, setVisibleCount] = useState(1)
  useEffect(() => {
    if (visibleCount >= chunks.length) return
    const schedule = typeof requestIdleCallback !== 'undefined'
      ? (cb) => requestIdleCallback(cb, { timeout: 200 })
      : requestAnimationFrame
    const cancel = typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback : cancelAnimationFrame
    const id = schedule(() => setVisibleCount(v => Math.min(v + 1, chunks.length)))
    return () => cancel(id)
  }, [visibleCount, chunks.length])
  return (
    <>
      {chunks.slice(0, visibleCount).map((chunk, i) => <MarkdownChunk key={i} content={chunk} />)}
      {visibleCount < chunks.length && (
        <div className="py-4 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          <span>Loading ({visibleCount}/{chunks.length} sections)...</span>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        </div>
      )}
    </>
  )
})

export default memo(function MarkdownRenderer({ content, className = '' }) {
  const deferredContent = useDeferredValue(content)
  const isPending = deferredContent !== content
  const isProgressive = deferredContent.length > PROGRESSIVE_THRESHOLD

  const chunks = useMemo(() => {
    if (!isProgressive) return null
    return splitContent(deferredContent, 15000)
  }, [deferredContent, isProgressive])

  return (
    <div
      className={`min-w-0 w-full max-w-full break-words ${className}`}
      style={{ opacity: isPending ? 0.7 : 1, transition: 'opacity 120ms ease' }}
    >
      {isProgressive && chunks
        ? <ProgressiveMarkdown chunks={chunks} />
        : <MarkdownChunk content={deferredContent} />
      }
    </div>
  )
}, (prev, next) => prev.content === next.content && prev.className === next.className)
