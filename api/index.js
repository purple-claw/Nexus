import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import config from './src/config.js'
import authRoutes from './src/routes/auth.js'
import dashboardRoutes from './src/routes/dashboard.js'
import libraryRoutes from './src/routes/library.js'
import topicsRoutes from './src/routes/topics.js'
import readingRoutes from './src/routes/reading.js'
import mcqsRoutes from './src/routes/mcqs.js'
import uploadRoutes from './src/routes/upload.js'
import calendarRoutes from './src/routes/calendar.js'
import todosRoutes from './src/routes/todos.js'
import dailyRoutes from './src/routes/daily.js'

const app = express()

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: config.corsOrigins, credentials: true }))
app.use(morgan('short'))
app.use(express.json({ limit: '16mb' }))
app.use(express.urlencoded({ extended: true, limit: '16mb' }))

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

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
