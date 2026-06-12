import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import MermaidBlock from './MermaidBlock'

export default function MarkdownRenderer({ content }) {
  const components = useMemo(() => ({
    code({ node, inline, className, children, ...props }) {
      if (inline) {
        return (
          <code className="px-1.5 py-0.5 rounded text-sm font-mono" {...props}
            style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}>
            {children}
          </code>
        )
      }

      const lang = className
        ?.split(' ')
        .find(cls => cls.startsWith('language-'))
        ?.replace('language-', '') || ''
      const codeString = String(children).replace(/\n$/, '')

      // Mermaid diagram
      if (lang === 'mermaid') {
        return <MermaidBlock chart={codeString} />
      }

      // Regular code block with syntax highlighting
      return (
        <div className="relative group">
          {lang && (
            <div className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded z-10"
              style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-tertiary)' }}>
              {lang}
            </div>
          )}
          <pre className="!mt-2 !mb-4 !rounded-lg !border" style={{ borderColor: 'var(--border)' }}>
            <code className={className} {...props}>{children}</code>
          </pre>
        </div>
      )
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full text-sm">{children}</table>
        </div>
      )
    },
    img({ src, alt }) {
      return <img src={src} alt={alt} loading="lazy" className="rounded-lg mx-auto" />
    },
    a({ href, children }) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent)' }}>
          {children}
        </a>
      )
    },
  }), [])

  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  )
}
