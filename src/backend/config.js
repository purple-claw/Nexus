const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  port: parseInt(process.env.PORT || '8080'),
  jwtSecret: process.env.JWT_SECRET || 'nexus-dev-jwt-secret-change-in-prod',
  databaseUrl: process.env.DATABASE_URL,
  uploadFolder: process.env.UPLOAD_FOLDER || './uploads',
  maxContentLength: 16 * 1024 * 1024,
  corsOrigins: (process.env.CORS_ORIGINS || 'https://nexus-iris.web.app,https://nexus-iris.firebaseapp.com,http://localhost:5173,http://localhost:5000').split(','),
}
