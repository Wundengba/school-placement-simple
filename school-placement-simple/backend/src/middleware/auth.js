import jwt from 'jsonwebtoken'

export const verifyAdminToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({ error: 'Not an admin token' })
    }

    req.admin = decoded
    next()
  } catch (error) {
    console.error('[AUTH] Token verification error:', error.message)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const verifyStudentToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (decoded.type !== 'student') {
      return res.status(403).json({ error: 'Not a student token' })
    }

    req.student = decoded
    next()
  } catch (error) {
    console.error('[AUTH] Token verification error:', error.message)
    return res.status(401).json({ error: 'Invalid token' })
  }
}
