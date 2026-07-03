import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components = {
  p: ({ children }) => <>{children}</>,
  pre: ({ children }) => <>{children}</>,
  code: ({ node: _node, inline, className: _className, children, ...props }) => {
    if (inline) {
      return (
        <code className="px-1 py-0.5 rounded text-sm font-mono" {...props}
          style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}>
          {children}
        </code>
      )
    }
    return (
      <div className="my-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <pre className="!m-0 !rounded-none !border-0 p-3 overflow-x-auto text-sm font-mono"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
          <code {...props}>{children}</code>
        </pre>
      </div>
    )
  },
}

export default function InlineMarkdown({ content }) {
  if (!content) return null
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}