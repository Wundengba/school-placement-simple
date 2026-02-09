import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
import schoolRoutes from './routes/schoolRoutes.js'
import placementRoutes from './routes/placementRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import syncRoutes from './routes/syncRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'

console.log('[INDEX] Auth Routes Imported:', !!authRoutes)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(express.json())

// Clean CORS_ORIGIN (remove newlines/whitespace from env var)
// Fallback to production frontend URL and localhost for development
const corsOrigin = (process.env.CORS_ORIGIN || 'https://frontend-three-lovat-67.vercel.app')
  .trim()
  .split('\n')[0]  // Take only the first line if multiple lines exist
  .replace(/[^\x20-\x7E]/g, '')  // Remove all non-printable ASCII characters
  .replace(/\s+/g, '')  // Remove all whitespace

// If the env var is malformed, use the production URL directly
const corsOriginFinal = corsOrigin && corsOrigin.length > 0 
  ? corsOrigin 
  : 'https://frontend-three-lovat-67.vercel.app'

app.use(cors({
  origin: corsOriginFinal,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Add a simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Health check - MUST be before MongoDB connection
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

// Connect to MongoDB (async, don't block server startup)
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err && err.message)
  // Continue running even if DB connection fails
})

// DB status endpoint
app.get('/api/db-status', (req, res) => {
  const readyState = mongoose.connection && mongoose.connection.readyState
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  res.json({
    success: true,
    readyState,
    state: states[readyState] || 'unknown',
    host: mongoose.connection && mongoose.connection.host
  })
})

// Test DB connection endpoint (invokes connectDB and returns diagnostic info)
app.get('/api/db-test', async (req, res) => {
  try {
    const conn = await connectDB()
    if (!conn) return res.status(500).json({ success: false, message: 'connectDB returned null' })
    res.json({ success: true, host: conn.connection.host, readyState: mongoose.connection.readyState })
  } catch (err) {
    console.error('[DB-TEST] Error during connect:', err && err.message)
    res.status(500).json({ success: false, error: err && err.message })
  }
})

// Debug route to check if routes are loaded
app.get('/api/debug/routes', (req, res) => {
  res.json({
    message: 'Routes test',
    authRoutesImported: !!authRoutes,
    studentRoutesImported: !!studentRoutes,
    schoolRoutesImported: !!schoolRoutes,
    placementRoutesImported: !!placementRoutes,
    syncRoutesImported: !!syncRoutes,
    dashboardRoutesImported: !!dashboardRoutes
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/schools', schoolRoutes)
app.use('/api/placements', placementRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/dashboard', dashboardRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error', error: err.message })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
})

export default app
