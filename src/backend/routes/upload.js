const { Router  } = require('express')
const multer = require('multer')
const db = require('../db.js')
const config = require('../config.js')
const { authMiddleware  } = require('../middleware/auth.js')
const { saveParsedDocument  } = require('../services/study.js')
const { parseMarkdown  } = require('../parser.js')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxContentLength } })
const router = Router()

const ALLOWED_MIME_TYPES = [
  'text/markdown', 'text/plain', 'text/x-markdown',
  'application/octet-stream',
]

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    let content = null
    let filename = 'document.md'

    if (req.file) {
      if (req.file.mimetype && !ALLOWED_MIME_TYPES.includes(req.file.mimetype) && !req.file.originalname?.endsWith('.md')) {
        return res.status(400).json({ error: 'Only markdown (.md) and text files are supported' })
      }
      content = req.file.buffer.toString('utf-8')
      filename = req.file.originalname || filename
    } else if (req.body && req.body.md_content) {
      content = req.body.md_content
    } else if (req.is('application/json')) {
      content = req.body?.content || req.body?.md_content
    }

    if (!content) return res.status(400).json({ error: 'No content provided' })

    if (Buffer.byteLength(content, 'utf-8') > config.maxContentLength) {
      return res.status(400).json({ error: 'Content exceeds maximum size' })
    }

    const parsed = parseMarkdown(content)
    const topicId = await saveParsedDocument(db, req.user.id, parsed, filename)
    res.json({ success: true, message: 'Document saved successfully!', topic_id: topicId })
  } catch (err) {
    console.error('Upload error:', err.message, err.stack)
    res.status(500).json({ error: 'Failed to process document. Please check the format and try again.' })
  }
})

module.exports = router
