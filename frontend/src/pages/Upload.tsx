import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUpload, FiFile, FiX, FiCheck, FiArrowRight } from 'react-icons/fi'
import client from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { useToast } from '../context/ToastContext'

export default function Upload() {
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)
  const textareaRef = useRef(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleFile = (file) => {
    if (!file) return
    setFilename(file.name)
    const reader = new FileReader()
    reader.onload = (e) => setContent((e.target?.result as string) || '')
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

  const handleBrowse = () => fileRef.current?.click()

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file' && (item.type === 'text/markdown' || item.type === 'text/plain')) {
        const file = item.getAsFile()
        if (file) { handleFile(file); return }
      }
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
          Paste markdown or drag a .md file — preview renders live beside it
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="card overflow-hidden flex flex-col flex-1">
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Upload Content
              </span>
              {filename && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                  <FiFile className="w-3 h-3" />
                  {filename}
                </span>
              )}
            </div>

            {/* Drop bar — always visible above textarea */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={handleBrowse}
              className="flex items-center gap-3 px-4 py-3 mx-4 mt-4 rounded-xl cursor-pointer transition-colors"
              style={{
                background: dragOver ? 'var(--accent-light)' : 'var(--bg-elevated)',
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              <FiUpload className="w-5 h-5 shrink-0" style={{ color: dragOver ? 'var(--accent)' : 'var(--text-tertiary)' }} />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Drop a <strong>.md</strong> or <strong>.txt</strong> file here
              </span>
              <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                or click to browse
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".md,.txt"
                onChange={(e) => handleFile(e.target.files[0])}
                className="hidden"
              />
            </div>

            {/* Textarea */}
            <div className="flex-1 p-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                className="w-full min-h-[320px] h-full p-4 font-mono text-sm resize-none rounded-xl border-0 outline-none"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Paste your markdown content here...&#10;&#10;Or drag a .md file onto the bar above."
              />
            </div>

            {/* Footer */}
            {content && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {content.split('\n').length} lines
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setContent(''); setFilename('') }}
                    className="btn btn-ghost btn-sm"
                  >
                    <FiX className="w-4 h-4" /> Clear
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-primary btn-sm"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><FiCheck className="w-4 h-4" /> Save Document</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Preview */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <div className="card overflow-hidden flex flex-col flex-1">
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <FiArrowRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Preview
              </span>
              {!content && (
                <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                  Content will appear here
                </span>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto min-h-[400px] max-h-[70vh]">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <FiUpload className="w-10 h-10 mb-3" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Add content on the left to see a live preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}