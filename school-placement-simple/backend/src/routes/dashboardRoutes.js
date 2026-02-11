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

    const [schoolInfo, assignedPlacements, stats] = await Promise.all([
      School.findById(schoolId),
      Placement.find({ schoolId })
        .populate('studentId', 'name email testScores')
        .sort({ createdAt: -1 }),
      Placement.aggregate([
        { $match: { schoolId: require('mongoose').Types.ObjectId(schoolId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ])

    if (!schoolInfo) {
      return res.status(404).json({ success: false, message: 'School not found' })
    }

    res.json({
      success: true,
      school: schoolInfo,
      placements: assignedPlacements,
      stats: {
        total: assignedPlacements.length,
        accepted: assignedPlacements.filter(p => p.status === 'accepted').length,
        pending: assignedPlacements.filter(p => p.status === 'pending').length,
        rejected: assignedPlacements.filter(p => p.status === 'rejected').length
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

    const [studentInfo, placements, placementHistory] = await Promise.all([
      Student.findById(studentId),
      Placement.find({ studentId })
        .populate('schoolId', 'name location capacity sector')
        .sort({ createdAt: -1 }),
      PlacementHistory.find({ studentId })
        .sort({ createdAt: -1 })
        .limit(20)
    ])

    if (!studentInfo) {
      return res.status(404).json({ success: false, message: 'Student not found' })
    }

    // Find current placement (if any)
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

    const history = await PlacementHistory.find({ placementId })
      .sort({ createdAt: -1 })
      .populate('changedBy', 'username')

    res.json({
      success: true,
      history
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
