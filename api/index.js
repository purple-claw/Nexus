require('express-async-errors')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const config = require('../src/backend/config.js')
const db = require('../src/backend/db.js')
const authRoutes = require('../src/backend/routes/auth.js')
const dashboardRoutes = require('../src/backend/routes/dashboard.js')
const libraryRoutes = require('../src/backend/routes/library.js')
const topicsRoutes = require('../src/backend/routes/topics.js')
const readingRoutes = require('../src/backend/routes/reading.js')
const mcqsRoutes = require('../src/backend/routes/mcqs.js')
const uploadRoutes = require('../src/backend/routes/upload.js')
const calendarRoutes = require('../src/backend/routes/calendar.js')
const todosRoutes = require('../src/backend/routes/todos.js')
const dailyRoutes = require('../src/backend/routes/daily.js')

const app = express()

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: config.corsOrigins, credentials: true }))
app.use(morgan('short'))
app.use(express.json({ limit: '16mb' }))
app.use(express.urlencoded({ extended: true, limit: '16mb' }))

app.use(async (req, res, next) => {
  if (!db._ready) {
    try {
      await db.init()
    } catch (err) {
      console.error('DB init failed:', err.message, err.stack)
      return res.status(500).json({ error: 'Database initialization failed: ' + err.message })
    }
  }
  next()
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message, err.stack)
})
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message, err.stack)
})

app.use('/api', authRoutes)
app.use('/api', dashboardRoutes)
app.use('/api', libraryRoutes)
app.use('/api', topicsRoutes)
app.use('/api', readingRoutes)
app.use('/api', mcqsRoutes)
app.use('/api', uploadRoutes)
app.use('/api', calendarRoutes)
app.use('/api', todosRoutes)
app.use('/api', dailyRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', ready: db._ready }))

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = app
