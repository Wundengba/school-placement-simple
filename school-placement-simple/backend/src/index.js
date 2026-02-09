import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import studentRoutes from './routes/studentRoutes.js'
import schoolRoutes from './routes/schoolRoutes.js'
import placementRoutes from './routes/placementRoutes.js'
import syncRoutes from './routes/syncRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(express.json())

// Clean CORS_ORIGIN (remove newlines/whitespace from env var)
const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .trim()
  .split('\n')[0]  // Take only the first line if multiple lines exist
  .replace(/[^\x20-\x7E]/g, '')  // Remove all non-printable ASCII characters

app.use(cors({
  origin: corsOrigin || 'http://localhost:5173'
}))

// Connect to MongoDB
connectDB()

// Routes
app.use('/api/students', studentRoutes)
app.use('/api/schools', schoolRoutes)
app.use('/api/placements', placementRoutes)
app.use('/api/sync', syncRoutes)

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
})

export default app
