import { Router, Response } from 'express'
import multer from 'multer'
import db from '../db'
import { config } from '../config'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { saveParsedDocument } from '../services/study'
import { parseMarkdown } from '../parser'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxContentLength } })
const router = Router()

const ALLOWED_MIME_TYPES = [
  'text/markdown', 'text/plain', 'text/x-markdown',
  'application/octet-stream',
]

router.post('/upload', authMiddleware, upload.single('file') as any, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let content: string | null = null
    let filename = 'document.md'

    if (req.file) {
      if (req.file.mimetype && !ALLOWED_MIME_TYPES.includes(req.file.mimetype) && !(req.file.originalname?.endsWith('.md'))) {
        res.status(400).json({ error: 'Only markdown (.md) and text files are supported' })
        return
      }
      content = req.file.buffer.toString('utf-8')
      filename = req.file.originalname || filename
    } else if (req.body && req.body.md_content) {
      content = req.body.md_content
    } else if (req.is('application/json')) {
      content = req.body?.content || req.body?.md_content
    }

    if (!content) {
      res.status(400).json({ error: 'No content provided' })
      return
    }

    if (Buffer.byteLength(content, 'utf-8') > config.maxContentLength) {
      res.status(400).json({ error: 'Content exceeds maximum size' })
      return
    }

    const parsed = parseMarkdown(content)
    const topicId = await saveParsedDocument(db, req.user!.id, parsed, filename)
    res.json({ success: true, message: 'Document saved successfully!', topic_id: topicId })
  } catch (err: any) {
    console.error('Upload error:', err.message, err.stack)
    res.status(500).json({ error: 'Failed to process document. Please check the format and try again.' })
  }
})

export default router
