import { Router } from 'express'
import multer from 'multer'
import db from '../db.js'
import config from '../config.js'
import { authMiddleware } from '../middleware/auth.js'
import { saveParsedDocument } from '../services/study.js'
import { parseMarkdown } from '../parser.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxContentLength } })
const router = Router()

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    let content = null
    let filename = 'document.md'

    if (req.file) {
      content = req.file.buffer.toString('utf-8')
      filename = req.file.originalname || filename
    } else if (req.body && req.body.md_content) {
      content = req.body.md_content
    } else if (req.is('application/json')) {
      content = req.body?.content || req.body?.md_content
    }

    if (!content) return res.status(400).json({ error: 'No content provided' })

    const parsed = parseMarkdown(content)
    const topicId = await saveParsedDocument(db, req.user.id, parsed, filename)
    res.json({ success: true, message: 'Document saved successfully!', topic_id: topicId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
