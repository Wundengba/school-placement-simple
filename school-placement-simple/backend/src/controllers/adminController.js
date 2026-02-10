import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

console.log('[ADMIN CONTROLLER] Initializing...')

export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body

    console.log('[loginAdmin] Attempt for username:', username)

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username }
    })

    if (!admin) {
      console.log('[loginAdmin] Admin not found:', username)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const isMatch = await bcryptjs.compare(password, admin.password)

    if (!isMatch) {
      console.log('[loginAdmin] Invalid password for:', username)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Create JWT token (30 day expiry for admin)
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        username: admin.username, 
        role: admin.role,
        type: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    console.log('✅ Admin login successful:', username)

    return res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('[loginAdmin] Error:', error.message)
    return res.status(500).json({ error: 'Server error during login' })
  }
}

export const registerAdmin = async (req, res) => {
  try {
    const { username, password, email, fullName, role } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username }
    })

    if (existingAdmin) {
      return res.status(409).json({ error: 'Username already exists' })
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create admin
    const newAdmin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        email,
        fullName,
        role: role || 'admin'
      }
    })

    console.log('✅ Admin registered:', username)

    return res.status(201).json({
      success: true,
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        fullName: newAdmin.fullName,
        role: newAdmin.role
      }
    })
  } catch (error) {
    console.error('[registerAdmin] Error:', error.message)
    return res.status(500).json({ error: 'Server error during registration' })
  }
}

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.adminId }
    })

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('[getAdminProfile] Error:', error.message)
    return res.status(500).json({ error: 'Server error' })
  }
}

export const updateAdminProfile = async (req, res) => {
  try {
    const { email, fullName } = req.body

    const updated = await prisma.admin.update({
      where: { id: req.admin.adminId },
      data: {
        email: email || undefined,
        fullName: fullName || undefined
      }
    })

    return res.status(200).json({
      success: true,
      admin: {
        id: updated.id,
        username: updated.username,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role
      }
    })
  } catch (error) {
    console.error('[updateAdminProfile] Error:', error.message)
    return res.status(500).json({ error: 'Server error' })
  }
}

export const listAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return res.status(200).json({
      success: true,
      admins
    })
  } catch (error) {
    console.error('[listAdmins] Error:', error.message)
    return res.status(500).json({ error: 'Server error' })
  }
}

export const deactivateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: { isActive: false }
    })

    return res.status(200).json({
      success: true,
      admin: updated
    })
  } catch (error) {
    console.error('[deactivateAdmin] Error:', error.message)
    return res.status(500).json({ error: 'Server error' })
  }
}
