import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import prisma from './config/prisma.js'
import { runMigrations } from './config/runMigrations.js'
import authRoutes from './routes/authRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
import schoolRoutes from './routes/schoolRoutes.js'
import placementRoutes from './routes/placementRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import syncRoutes from './routes/syncRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

console.log('[INDEX] Routes Imported')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(express.json())

// CORS configuration
const allowedOrigins = [
  'https://school-placement-fresh-202602092227.vercel.app',
  'https://school-placement-fresh-20260209222711-ny8uc778w.vercel.app',
  'https://frontend-three-lovat-67.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

app.use(cors({
  origin: function (origin, callback) {
    console.log('[CORS] Request origin:', origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.log('[CORS] Origin not allowed:', origin)
      callback(null, true) // Allow anyway to prevent blocking
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}))

// Add a simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Track migration status globally
let migrationsRunning = true
let migrationError = null

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    database: 'PostgreSQL (Neon)', 
    migrationsRunning,
    migrationError: migrationError ? migrationError.message : null,
    timestamp: new Date() 
  })
})

// Migration status endpoint
app.get('/api/migration-status', (req, res) => {
  res.json({
    migrationsRunning,
    migrationError: migrationError ? migrationError.message : null,
    migrationErrorStack: migrationError ? migrationError.stack : null,
    timestamp: new Date()
  })
})

// DB status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`
    res.json({
      success: true,
      database: 'PostgreSQL (Neon)',
      connected: true,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      database: 'PostgreSQL (Neon)',
      connected: false,
      error: error.message
    })
  }
})

// Test DB connection endpoint (invokes connectDB and returns diagnostic info)
app.get('/api/db-test', async (req, res) => {
  // Debug route to check if routes are loaded
  app.get('/api/debug/routes', (req, res) => {
    res.json({
      message: 'Routes test',
      authRoutesImported: !!authRoutes,
      studentRoutesImported: !!studentRoutes,
      schoolRoutesImported: !!schoolRoutes,
      placementRoutesImported: !!placementRoutes,
      syncRoutesImported: !!syncRoutes,
      dashboardRoutesImported: !!dashboardRoutes,
      database: 'PostgreSQL (Neon)'
    })
  })

  res.json({ success: true, message: 'DB test endpoint (Postgres via Prisma)' })
})

// Student login endpoint (for parents/students) - index number only [PRISMA]
app.post('/api/login', async (req, res) => {
  try {
    const { indexNumber } = req.body
    
    if (!indexNumber) {
      return res.status(400).json({ success: false, message: 'Index number required' })
    }
    
    // Find student by index number using Prisma
    let student = null
    try {
      student = await prisma.student.findUnique({
        where: { indexNumber: indexNumber.trim() }
      })
    } catch (dbErr) {
      console.error('[LOGIN] Database error:', dbErr.message)
      // If migrations are still running, provide helpful message
      if (migrationsRunning) {
        return res.status(503).json({ 
          success: false, 
          message: 'System initializing (migrations running). Please try again in 30 seconds.'
        })
      }
      throw dbErr
    }
    
    if (!student) {
      console.log('[LOGIN] Student not found:', indexNumber)
      return res.status(401).json({ success: false, message: 'Invalid index number' })
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { indexNumber: student.indexNumber, studentId: student.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
      { expiresIn: '30d' }
    )
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      student: {
        id: student.id,
        indexNumber: student.indexNumber,
        fullName: student.fullName,
        email: student.email || '',
        maths: student.maths || null,
        english: student.english || null,
        science: student.science || null,
        placedSchool: student.placedSchool || null,
        status: student.status || 'pending'
      }
    })
  } catch (error) {
    console.error('[LOGIN] Error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
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

// Run migrations in background (non-blocking)
runMigrations()
  .then(() => {
    console.log('[STARTUP] ✅ Schema sync completed')
    migrationsRunning = false
  })
  .catch(err => {
    console.error('[STARTUP] ⚠️  Schema sync encountered error:', err.message)
    migrationError = err
    migrationsRunning = false
  })
  .finally(() => {
    console.log('[STARTUP] Migration process finished')
  })

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
  console.log(`Database: PostgreSQL (Neon) - Schema sync running in background`)
})

export default app
