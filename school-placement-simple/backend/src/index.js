import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import studentRoutes from './routes/studentRoutes.js'
import schoolRoutes from './routes/schoolRoutes.js'
import placementRoutes from './routes/placementRoutes.js'
import syncRoutes from './routes/syncRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}))

// Connect to MongoDB
connectDB()

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'School Placement API - Running on Vercel', version: '1.0.0' })
})

app.get('/api', (req, res) => {
  res.json({ message: 'School Placement API', endpoints: ['/api/health', '/api/students', '/api/schools', '/api/placements', '/api/sync', '/api/notifications'] })
})

// Routes
app.use('/api/students', studentRoutes)
app.use('/api/schools', schoolRoutes)
app.use('/api/placements', placementRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error', error: err.message })
})

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV}`)
  })
}

export default app
