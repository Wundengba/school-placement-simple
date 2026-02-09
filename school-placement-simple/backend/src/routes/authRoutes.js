import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

const router = express.Router()

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword, fullName, role = 'staff' } = req.body

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username ? 'Username already taken' : 'Email already registered'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
      role
    })

    await newUser.save()

    // Return user data without password
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    })
  } catch (error) {
    console.error('[AUTH] Register error:', error.message)
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message })
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Validation
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' })
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    })

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Create token (simple JWT-like token: base64 encoded user data)
    const token = Buffer.from(JSON.stringify({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    })).toString('base64')

    // Return success with user data and token
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      token
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse
    })
  } catch (error) {
    console.error('[AUTH] Login error:', error.message)
    console.error('[AUTH] Error stack:', error.stack)
    res.status(500).json({ success: false, message: 'Login failed', error: error.message })
  }
})

// Get current user (verify token)
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    
    // Check if token is not too old (24 hours)
    const tokenAge = Date.now() - decoded.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    if (tokenAge > maxAge) {
      return res.status(401).json({ success: false, message: 'Token expired' })
    }

    res.json({
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      }
    })
  } catch (error) {
    console.error('[AUTH] Verify token error:', error.message)
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
})

// Create demo user (for testing) - only creates if it doesn't exist
router.post('/seed-demo', async (req, res) => {
  try {
    // Check if demo user already exists
    let demoUser = await User.findOne({ username: 'demo' })
    
    if (demoUser) {
      return res.json({
        success: true,
        message: 'Demo user already exists',
        user: {
          username: demoUser.username,
          email: demoUser.email
        }
      })
    }
    
    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10)
    demoUser = new User({
      username: 'demo',
      email: 'demo@example.com',
      password: hashedPassword,
      fullName: 'Demo User',
      role: 'admin'
    })
    
    await demoUser.save()
    
    console.log('[AUTH] Demo user created successfully')
    res.status(201).json({
      success: true,
      message: 'Demo user created successfully',
      user: {
        username: demoUser.username,
        email: demoUser.email,
        fullName: demoUser.fullName,
        role: demoUser.role
      }
    })
  } catch (error) {
    console.error('[AUTH] Seed demo user error:', error.message)
    res.status(500).json({ success: false, message: 'Failed to create demo user', error: error.message })
  }
})

export default router
