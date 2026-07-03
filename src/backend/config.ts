import dotenv from 'dotenv'
dotenv.config()

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable is required in production')
  process.exit(1)
}

const jwtSecret: string = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'nexus-dev-jwt-secret-change-in-prod' : '')

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  jwtSecret,
  databaseUrl: process.env.DATABASE_URL || null,
  uploadFolder: process.env.UPLOAD_FOLDER || './uploads',
  maxContentLength: 16 * 1024 * 1024,
  corsOrigins: (process.env.CORS_ORIGINS || 'https://nexus-iris.web.app,https://nexus-iris.firebaseapp.com,http://localhost:5173,http://localhost:5000').split(','),
}
