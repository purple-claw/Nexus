import { Response } from 'express'

function sendSuccess(res: Response, data: any = null, status: number = 200): void {
  if (data === null) {
    res.status(status).json({ success: true })
    return
  }
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    res.status(status).json({ success: true, ...data })
    return
  }
  res.status(status).json({ success: true, data })
}

function sendError(res: Response, message: string, status: number = 400): void {
  res.status(status).json({ error: message })
}

export { sendSuccess, sendError }
