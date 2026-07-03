function sendSuccess(res, data = null, status = 200) {
  if (data === null) return res.status(status).json({ success: true })
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    return res.status(status).json({ success: true, ...data })
  }
  return res.status(status).json({ success: true, data })
}

function sendError(res, message, status = 400) {
  return res.status(status).json({ error: message })
}

module.exports = { sendSuccess, sendError }
