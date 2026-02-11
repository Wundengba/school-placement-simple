import express from 'express'
import prisma from '../config/prisma.js'
import { getActivityLogs } from '../utils/auditLogger.js'

const router = express.Router()

/**
 * Admin Dashboard - Overall statistics
 */
router.get('/admin', async (req, res) => {
  try {
    // Check if user is admin
    if (req.query.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }
    // Use Prisma counts (Postgres)
    const [totalStudents, totalSchools, totalPlacements, placedStudents, pendingPlacements, rejectedPlacements] = await Promise.all([
      prisma.student.count(),
      prisma.school.count(),
      prisma.placement.count(),
      prisma.placement.count({ where: { status: 'accepted' } }),
      prisma.placement.count({ where: { status: 'pending' } }),
      prisma.placement.count({ where: { status: 'rejected' } })
    ])

    const placementStats = [
      { status: 'accepted', count: placedStudents },
      { status: 'pending', count: pendingPlacements },
      { status: 'rejected', count: rejectedPlacements }
    ]

    // Recent activity uses Mongo-based ActivityLog; skip if not available
    let recentActivity = []
    try {
      const logsResult = await getActivityLogs({}, 10, 1)
      recentActivity = logsResult.logs || []
    } catch (e) {
      recentActivity = []
    }

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalSchools,
        totalPlacements,
        placedStudents,
        pendingPlacements,
        placementRate: totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) + '%' : '0%'
      },
      placementStats,
      recentActivity
    })
  } catch (err) {
    console.error('[DASHBOARD] Admin error:', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch admin dashboard', error: err.message })
  }
})

/**
 * School Dashboard - Assigned students and placements
 */
router.get('/school', async (req, res) => {
  try {
    const { schoolId } = req.query
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId required' })
    }

    // Use Prisma to fetch school and placements
    const schoolInfo = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!schoolInfo) {
      return res.status(404).json({ success: false, message: 'School not found' })
    }

    const assignedPlacements = await prisma.placement.findMany({
      where: { schoolId },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, maths: true, english: true, science: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const [total, accepted, pending, rejected] = await Promise.all([
      prisma.placement.count({ where: { schoolId } }),
      prisma.placement.count({ where: { schoolId, status: 'accepted' } }),
      prisma.placement.count({ where: { schoolId, status: 'pending' } }),
      prisma.placement.count({ where: { schoolId, status: 'rejected' } }),
    ])

    res.json({
      success: true,
      school: schoolInfo,
      placements: assignedPlacements,
      stats: {
        total,
        accepted,
        pending,
        rejected
      }
    })
  } catch (err) {
    console.error('[DASHBOARD] School error:', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch school dashboard', error: err.message })
  }
})

/**
 * Student Dashboard - Placement status and history
 */
router.get('/student', async (req, res) => {
  try {
    const { studentId } = req.query
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId required' })
    }

    // Fetch student and placements with Prisma
    const studentInfo = await prisma.student.findUnique({ where: { id: studentId } })
    if (!studentInfo) {
      return res.status(404).json({ success: false, message: 'Student not found' })
    }

    const placements = await prisma.placement.findMany({
      where: { studentId },
      include: {
        school: { select: { id: true, name: true, location: true, capacity: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // No PlacementHistory model in Prisma currently; return placements as history fallback
    const placementHistory = []

    const currentPlacement = placements.find(p => p.status === 'accepted') || null

    res.json({
      success: true,
      student: studentInfo,
      currentPlacement,
      allPlacements: placements,
      history: placementHistory,
      stats: {
        total: placements.length,
        accepted: placements.filter(p => p.status === 'accepted').length,
        pending: placements.filter(p => p.status === 'pending').length,
        rejected: placements.filter(p => p.status === 'rejected').length
      }
    })
  } catch (err) {
    console.error('[DASHBOARD] Student error:', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch student dashboard', error: err.message })
  }
})

/**
 * Get placement history for a specific placement
 */
router.get('/placement-history/:placementId', async (req, res) => {
  try {
    const { placementId } = req.params

    // PlacementHistory not yet migrated to Prisma; return empty history for now
    res.json({
      success: true,
      history: []
    })
  } catch (err) {
    console.error('[DASHBOARD] History error:', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch placement history', error: err.message })
  }
})

/**
 * Get activity logs (admin only)
 */
router.get('/activity-logs', async (req, res) => {
  try {
    const { role, limit = 50, page = 1 } = req.query

    if (role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const result = await getActivityLogs({}, parseInt(limit), parseInt(page))

    res.json({
      success: true,
      ...result
    })
  } catch (err) {
    console.error('[DASHBOARD] Activity logs error:', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs', error: err.message })
  }
})

export default router
