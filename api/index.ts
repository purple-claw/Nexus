import 'express-async-errors'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import helmet from 'helmet'
import morgan from 'morgan'
import { config } from '../src/backend/config'
import db from '../src/backend/db'
import authRoutes from '../src/backend/routes/auth'
import dashboardRoutes from '../src/backend/routes/dashboard'
import libraryRoutes from '../src/backend/routes/library'
import topicsRoutes from '../src/backend/routes/topics'
import readingRoutes from '../src/backend/routes/reading'
import mcqsRoutes from '../src/backend/routes/mcqs'
import uploadRoutes from '../src/backend/routes/upload'
import calendarRoutes from '../src/backend/routes/calendar'
import todosRoutes from '../src/backend/routes/todos'
import dailyRoutes from '../src/backend/routes/daily'
import openapi from './openapi.json'

const app = express()

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'Nexus API Docs' }))

app.use(cors({ origin: config.corsOrigins, credentials: true }))
app.use(morgan('short'))
app.use(express.json({ limit: '16mb' }))
app.use(express.urlencoded({ extended: true, limit: '16mb' }))

app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!db._ready) {
    try {
      await db.init()
    } catch (err: any) {
      console.error('DB init failed:', err.message, err.stack)
      return res.status(500).json({ error: 'Database initialization failed: ' + err.message })
    }
  }
  next()
})

process.on('unhandledRejection', (err: any) => {
  console.error('Unhandled Rejection:', err.message, err.stack)
})
process.on('uncaughtException', (err: any) => {
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

app.get('/api/health', (req: Request, res: Response) => res.json({ status: 'ok', ready: db._ready }))

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
