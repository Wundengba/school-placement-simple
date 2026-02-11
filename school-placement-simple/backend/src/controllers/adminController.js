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

// Mock Exam Management Functions

export const createMock = async (req, res) => {
  try {
    const { title, description } = req.body
    const adminUsername = req.admin.username

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const mock = await prisma.mock.create({
      data: {
        title,
        description,
        createdBy: adminUsername,
        isActive: true
      }
    })

    console.log('✅ Mock exam created:', title, 'by', adminUsername)

    return res.status(201).json({
      success: true,
      mock
    })
  } catch (error) {
    console.error('[createMock] Error:', error.message)
    return res.status(500).json({ error: 'Server error creating mock' })
  }
}

export const listMocks = async (req, res) => {
  try {
    const mocks = await prisma.mock.findMany({
      include: {
        subjects: {
          select: {
            id: true,
            subject: true,
            score: true,
            studentId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.status(200).json({
      success: true,
      mocks
    })
  } catch (error) {
    console.error('[listMocks] Error:', error.message)
    return res.status(500).json({ error: 'Server error fetching mocks' })
  }
}

export const getMockDetails = async (req, res) => {
  try {
    const { mockId } = req.params

    const mock = await prisma.mock.findUnique({
      where: { id: mockId },
      include: {
        subjects: {
          include: {
            student: {
              select: {
                id: true,
                indexNumber: true,
                fullName: true
              }
            }
          }
        }
      }
    })

    if (!mock) {
      return res.status(404).json({ error: 'Mock not found' })
    }

    return res.status(200).json({
      success: true,
      mock
    })
  } catch (error) {
    console.error('[getMockDetails] Error:', error.message)
    return res.status(500).json({ error: 'Server error fetching mock details' })
  }
}

export const updateMock = async (req, res) => {
  try {
    const { mockId } = req.params
    const { title, description, isActive } = req.body

    const mock = await prisma.mock.update({
      where: { id: mockId },
      data: {
        title: title || undefined,
        description: description || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    })

    console.log('✅ Mock exam updated:', mockId)

    return res.status(200).json({
      success: true,
      mock
    })
  } catch (error) {
    console.error('[updateMock] Error:', error.message)
    return res.status(500).json({ error: 'Server error updating mock' })
  }
}

export const deleteMock = async (req, res) => {
  try {
    const { mockId } = req.params

    await prisma.mock.delete({
      where: { id: mockId }
    })

    console.log('✅ Mock exam deleted:', mockId)

    return res.status(200).json({
      success: true,
      message: 'Mock deleted successfully'
    })
  } catch (error) {
    console.error('[deleteMock] Error:', error.message)
    return res.status(500).json({ error: 'Server error deleting mock' })
  }
}

export const assignMockScores = async (req, res) => {
  try {
    const { mockId } = req.params
    const { scores } = req.body // Array of {studentId, subject, score}

    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ error: 'Scores array is required' })
    }

    // Verify mock exists
    const mockExists = await prisma.mock.findUnique({
      where: { id: mockId }
    })

    if (!mockExists) {
      return res.status(404).json({ error: 'Mock not found' })
    }

    // Create or update mock scores
    const createdScores = []

    for (const scoreData of scores) {
      const { studentId, subject, score } = scoreData

      if (!studentId || !subject || score === undefined) {
        continue
      }

      const mockScore = await prisma.mockScore.upsert({
        where: {
          mockId_studentId_subject: {
            mockId,
            studentId,
            subject
          }
        },
        update: {
          score
        },
        create: {
          mockId,
          studentId,
          subject,
          score
        }
      })

      createdScores.push(mockScore)
    }

    console.log('✅ Mock scores assigned:', mockId, 'for', createdScores.length, 'scores')

    return res.status(200).json({
      success: true,
      scoresCount: createdScores.length,
      message: `${createdScores.length} scores assigned`
    })
  } catch (error) {
    console.error('[assignMockScores] Error:', error.message)
    return res.status(500).json({ error: 'Server error assigning mock scores' })
  }
}

export const updateMockScore = async (req, res) => {
  try {
    const { mockId, scoreId } = req.params
    const { score } = req.body

    if (score === undefined) {
      return res.status(400).json({ error: 'Score is required' })
    }

    const mockScore = await prisma.mockScore.update({
      where: { id: scoreId },
      data: { score }
    })

    console.log('✅ Mock score updated:', scoreId)

    return res.status(200).json({
      success: true,
      mockScore
    })
  } catch (error) {
    console.error('[updateMockScore] Error:', error.message)
    return res.status(500).json({ error: 'Server error updating mock score' })
  }
}

// Examination Types (persisted via raw SQL to avoid schema/client regeneration)
export const ensureExamTypesTable = async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExaminationType" (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now()
      );
    `)
  } catch (err) {
    console.error('[ensureExamTypesTable] Error ensuring table exists:', err.message)
  }
}

export const listExamTypes = async (req, res) => {
  try {
    await ensureExamTypesTable()
    const rows = await prisma.$queryRawUnsafe('SELECT id, name, description, "createdAt", "updatedAt" FROM "ExaminationType" ORDER BY "createdAt" DESC')
    return res.status(200).json({ success: true, examTypes: rows })
  } catch (err) {
    console.error('[listExamTypes] Error:', err.message)
    return res.status(500).json({ error: 'Server error listing exam types' })
  }
}

export const createExamType = async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })
    await ensureExamTypesTable()
    const id = Date.now().toString()
    await prisma.$executeRawUnsafe('INSERT INTO "ExaminationType" (id, name, description) VALUES ($1, $2, $3)', id, name, description || null)
    return res.status(201).json({ success: true, examType: { id, name, description } })
  } catch (err) {
    console.error('[createExamType] Error:', err.message)
    if (err.message && err.message.includes('unique')) return res.status(409).json({ error: 'Exam type already exists' })
    return res.status(500).json({ error: 'Server error creating exam type' })
  }
}

export const updateExamType = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    if (!id) return res.status(400).json({ error: 'ID required' })
    await ensureExamTypesTable()
    await prisma.$executeRawUnsafe('UPDATE "ExaminationType" SET name = $2, description = $3, "updatedAt" = now() WHERE id = $1', id, name, description || null)
    return res.status(200).json({ success: true, examType: { id, name, description } })
  } catch (err) {
    console.error('[updateExamType] Error:', err.message)
    return res.status(500).json({ error: 'Server error updating exam type' })
  }
}

export const deleteExamType = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'ID required' })
    await ensureExamTypesTable()
    await prisma.$executeRawUnsafe('DELETE FROM "ExaminationType" WHERE id = $1', id)
    return res.status(200).json({ success: true, message: 'Deleted' })
  } catch (err) {
    console.error('[deleteExamType] Error:', err.message)
    return res.status(500).json({ error: 'Server error deleting exam type' })
  }
}
