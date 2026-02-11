import express from 'express'
import prisma from '../config/prisma.js'

const router = express.Router()

// Upload data to database (upsert) [SIMPLIFIED FOR PRISMA]
router.post('/upload', async (req, res) => {
  try {
    const { schools, students, scores, preferences, placementResults, analytics, deletedStudents = [], deletedScores = [], deletedSchools = [] } = req.body
    
    console.log('[SYNC-UPLOAD] Starting upload with:', {
      schoolsCount: schools?.length || 0,
      studentsCount: students?.length || 0,
      scoresCount: scores?.length || 0,
      preferencesCount: preferences?.length || 0,
      placementResultsCount: placementResults?.length || 0,
      hasAnalytics: !!analytics,
      deletedStudents: deletedStudents?.length || 0,
      deletedScores: deletedScores?.length || 0,
      deletedSchools: deletedSchools?.length || 0
    })

    // Merge test scores into student records
    const studentsByIndexNumber = {}
    if (Array.isArray(students)) {
      students.forEach(s => {
        studentsByIndexNumber[s.indexNumber] = s
      })
    }
    
    if (Array.isArray(scores)) {
      scores.forEach(score => {
        if (studentsByIndexNumber[score.indexNumber]) {
          studentsByIndexNumber[score.indexNumber] = {
            ...studentsByIndexNumber[score.indexNumber],
            maths: score.maths || studentsByIndexNumber[score.indexNumber].maths,
            english: score.english || studentsByIndexNumber[score.indexNumber].english,
            science: score.science || studentsByIndexNumber[score.indexNumber].science
          }
        }
      })
    }

    const mergedStudents = Object.values(studentsByIndexNumber)

    // Batch upsert schools
    if (schools && Array.isArray(schools) && schools.length > 0) {
      try {
        for (const school of schools) {
          if (!school.id) {
            console.warn('[SYNC-UPLOAD] Skipping school without id:', school.name)
            continue
          }
          await prisma.school.upsert({
            where: { id: school.id },
            update: { ...school, updatedAt: new Date() },
            create: { ...school, id: school.id }
          })
        }
        console.log('[SYNC-UPLOAD] Upserted schools:', schools.length)
      } catch (err) {
        console.error('[SYNC-UPLOAD] School upsert error:', err.message)
      }
    }

    // Batch upsert students
    if (mergedStudents && Array.isArray(mergedStudents) && mergedStudents.length > 0) {
      try {
        for (const student of mergedStudents) {
          if (!student.indexNumber) {
            console.warn('[SYNC-UPLOAD] Skipping student without indexNumber')
            continue
          }
          await prisma.student.upsert({
            where: { indexNumber: student.indexNumber },
            update: { 
              ...student, 
              updatedAt: new Date(),
              deleted: deletedStudents?.includes(student.indexNumber) ? true : false
            },
            create: student
          })
        }
        console.log('[SYNC-UPLOAD] Upserted students:', mergedStudents.length)
      } catch (err) {
        console.error('[SYNC-UPLOAD] Student upsert error:', err.message)
      }
    }

    // Batch upsert placements
    if (placementResults && Array.isArray(placementResults) && placementResults.length > 0) {
      try {
        for (const result of placementResults) {
          if (!result.id) {
            console.warn('[SYNC-UPLOAD] Skipping placement without id')
            continue
          }
          await prisma.placement.upsert({
            where: { id: result.id },
            update: { ...result, updatedAt: new Date() },
            create: { ...result, id: result.id }
          })
        }
        console.log('[SYNC-UPLOAD] Upserted placements:', placementResults.length)
      } catch (err) {
        console.error('[SYNC-UPLOAD] Placement upsert error:', err.message)
      }
    }

    res.json({
      success: true,
      message: 'Data synced successfully',
      synced: {
        schools: schools?.length || 0,
        students: mergedStudents?.length || 0,
        scores: scores?.length || 0,
        placementResults: placementResults?.length || 0,
        deletedStudents: deletedStudents?.length || 0,
        deletedScores: deletedScores?.length || 0,
        deletedSchools: deletedSchools?.length || 0,
        analytics: !!analytics
      }
    })
  } catch (error) {
    console.error('[SYNC-UPLOAD] Upload error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Download database snapshot [PRISMA VERSION]
router.get('/download', async (req, res) => {
  try {
    const lastSyncTime = req.query.lastSyncTime ? new Date(req.query.lastSyncTime) : null
    
    console.log('[SYNC-DOWNLOAD] Starting download of all collections...')
    console.log('[SYNC-DOWNLOAD] LastSyncTime:', lastSyncTime)
    
    // Build query filters for incremental sync
    const where = lastSyncTime ? { updatedAt: { gt: lastSyncTime } } : {}
    const whereNotDeleted = { ...where, deleted: false }
    
    // Query all data in parallel
    const [schools, students, placements] = await Promise.all([
      prisma.school.findMany({
        where: where,
        include: { streams: true }
      }),
      prisma.student.findMany({
        where: whereNotDeleted,
        include: { schoolPreferences: { include: { school: true } } }
      }),
      prisma.placement.findMany({
        where: where,
        include: { student: true, school: true }
      })
    ])

    console.log('[SYNC-DOWNLOAD] Retrieved:', {
      schoolsCount: schools?.length || 0,
      studentsCount: students?.length || 0,
      placementsCount: placements?.length || 0,
      incremental: !!lastSyncTime
    })

    const responseTime = new Date().toISOString()
    res.json({
      success: true,
      data: {
        schools: schools || [],
        students: students || [],
        scores: [], // No separate scores in new schema
        placementResults: placements || [],
        timestamp: responseTime,
        incremental: !!lastSyncTime
      }
    })
  } catch (error) {
    console.error('[SYNC-DOWNLOAD] Error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
