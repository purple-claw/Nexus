import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUpload, FiFile, FiX, FiCheck, FiCode, FiEye } from 'react-icons/fi'
import client from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { useToast } from '../context/ToastContext'

export default function Upload() {
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleFile = (file) => {
    if (!file) return
    setFilename(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setContent(e.target.result)
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.md') || file.name.endsWith('.txt'))) {
      handleFile(file)
    } else {
      toast.error('Please upload a .md or .txt file')
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please enter or upload markdown content')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('md_content', content)
      const { data } = await client.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Document saved successfully!')
      if (data.topic_id) {
        navigate(`/topics/${data.topic_id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Upload</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Upload a markdown document or paste content directly
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="card overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreview(false)}
                  className={`btn btn-sm ${!preview ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <FiCode className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setPreview(true)}
                  className={`btn btn-sm ${preview ? 'btn-primary' : 'btn-ghost'}`}
                >
                  <FiEye className="w-4 h-4" />
                  Preview
                </button>
              </div>
              {filename && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                  <FiFile className="w-3 h-3" />
                  {filename}
                </span>
              )}
            </div>

            {/* Drop zone / Textarea */}
            {!content ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center p-12 transition-colors cursor-pointer"
                style={{
                  background: dragOver ? 'var(--accent-light)' : 'transparent',
                  border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                }}
                onClick={() => fileRef.current?.click()}
              >
                <FiUpload className="w-10 h-10 mb-3" style={{ color: dragOver ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Drop your markdown file here
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  or click to browse (.md, .txt)
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".md,.txt"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                {preview ? (
                  <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[400px] p-4 font-mono text-sm resize-none border-0 outline-none"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="Paste your markdown content here..."
                  />
                )}
                {content && (
                  <button
                    onClick={() => { setContent(''); setFilename('') }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          {content && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex justify-end"
            >
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><FiCheck className="w-4 h-4" /> Save Document</>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Hint */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:block"
        >
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Markdown Format
            </h3>
            <div className="space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Title</p>
                <code className="font-mono"># Your Title</code>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Metadata</p>
                <pre className="font-mono">## Metadata
- Category: Science
- Subcategory: Physics
- Description: ...</pre>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Content Sections</p>
                <pre className="font-mono">## Content
### Section Title
Content with **bold**, ```mermaid```, etc.</pre>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>MCQs</p>
                <pre className="font-mono">## MCQs
**Q1:** Question?
- A) Option A
- B) Option B
**Answer:** B
**Difficulty:** easy
**Explanation:** ...</pre>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
