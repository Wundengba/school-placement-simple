import express from 'express'
import Student from '../models/Student.js'
import School from '../models/School.js'
import TestScore from '../models/TestScore.js'
import Placement from '../models/Placement.js'

const router = express.Router()

// Upload data to database (upsert)
router.post('/upload', async (req, res) => {
  try {
    const mongoose = await import('mongoose').then(m => m.default)
    const dbState = mongoose.connection.readyState
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
    
    const { schools, students, scores, preferences, placementResults, analytics } = req.body
    console.log('[SYNC-UPLOAD] DB State:', dbStates[dbState] || 'unknown', '(', dbState, ')')
    console.log('[SYNC-UPLOAD] Starting upload with:', {
      schoolsCount: schools?.length || 0,
      studentsCount: students?.length || 0,
      scoresCount: scores?.length || 0,
      preferencesCount: preferences?.length || 0,
      placementResultsCount: placementResults?.length || 0,
      hasAnalytics: !!analytics
    })

    // Use Promise.all for parallel batch operations
    const operations = []

    // Batch upsert schools
    if (schools && Array.isArray(schools) && schools.length > 0) {
      const schoolOps = schools.map(school =>
        School.updateOne(
          { externalId: school.externalId },
          { $set: { ...school, updatedAt: new Date() } },
          { upsert: true }
        ).catch(err => {
          console.error('[SYNC-UPLOAD] School upsert error:', err.message)
          return { error: err.message, type: 'school' }
        })
      )
      operations.push(...schoolOps)
    }

    // Batch upsert students
    if (students && Array.isArray(students) && students.length > 0) {
      const studentOps = students.map(student =>
        Student.updateOne(
          { indexNumber: student.indexNumber },
          { $set: { ...student, updatedAt: new Date() } },
          { upsert: true }
        ).catch(err => {
          console.error('[SYNC-UPLOAD] Student upsert error:', err.message)
          return { error: err.message, type: 'student' }
        })
      )
      operations.push(...studentOps)
    }

    // Batch upsert test scores
    if (scores && Array.isArray(scores) && scores.length > 0) {
      const scoreOps = scores.map(score =>
        TestScore.updateOne(
          { indexNumber: score.indexNumber },
          { $set: { ...score, updatedAt: new Date() } },
          { upsert: true }
        ).catch(err => {
          console.error('[SYNC-UPLOAD] Score upsert error:', err.message)
          return { error: err.message, type: 'score' }
        })
      )
      operations.push(...scoreOps)
    }

    // Batch upsert placement results
    if (placementResults && Array.isArray(placementResults) && placementResults.length > 0) {
      const placementOps = placementResults.map(result =>
        Placement.updateOne(
          { indexNumber: result.indexNumber },
          { $set: { ...result, updatedAt: new Date() } },
          { upsert: true }
        ).catch(err => {
          console.error('[SYNC-UPLOAD] Placement result upsert error:', err.message)
          return { error: err.message, type: 'placement' }
        })
      )
      operations.push(...placementOps)
    }

    // Execute all operations in parallel
    if (operations.length > 0) {
      console.log('[SYNC-UPLOAD] Executing', operations.length, 'parallel operations...')
      const results = await Promise.allSettled(operations)
      const failed = results.filter(r => r.status === 'rejected').length
      const succeeded = results.filter(r => r.status === 'fulfilled').length
      console.log('[SYNC-UPLOAD] Results: succeeded=', succeeded, ', failed=', failed)
      if (failed > 0) {
        console.log('[SYNC-UPLOAD] Failed operations:', results.filter(r => r.status === 'rejected').map(r => r.reason.message).slice(0, 5))
      }
    }

    res.json({
      success: true,
      message: 'Data synced successfully',
      synced: {
        schools: schools?.length || 0,
        students: students?.length || 0,
        scores: scores?.length || 0,
        placementResults: placementResults?.length || 0,
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

// Download database snapshot
router.get('/download', async (req, res) => {
  try {
    // Support lastSyncTime for incremental sync across devices
    const lastSyncTime = req.query.lastSyncTime ? new Date(req.query.lastSyncTime) : null
    
    console.log('[SYNC-DOWNLOAD] Starting download of all collections...')
    console.log('[SYNC-DOWNLOAD] LastSyncTime:', lastSyncTime)
    
    // Build query filters for incremental sync
    const schoolQuery = lastSyncTime ? { updatedAt: { $gt: lastSyncTime } } : {}
    const studentQuery = lastSyncTime ? { updatedAt: { $gt: lastSyncTime } } : {}
    const scoreQuery = lastSyncTime ? { updatedAt: { $gt: lastSyncTime } } : {}
    const placementQuery = lastSyncTime ? { updatedAt: { $gt: lastSyncTime } } : {}
    
    // Execute queries in parallel with timeout handling
    const [schools, students, scores, placementResults] = await Promise.all([
      School.find(schoolQuery).lean().exec(),
      Student.find(studentQuery).lean().exec(),
      TestScore.find(scoreQuery).lean().exec(),
      Placement.find(placementQuery).lean().exec()
    ]).then(results => results)
      .catch(error => {
        // Handle timeout error
        if (error.message.includes('buffering timed out')) {
          console.warn('[SYNC-DOWNLOAD] Database query timeout, returning empty datasets')
          return [[], [], [], []]
        }
        throw error
      })

    console.log('[SYNC-DOWNLOAD] Retrieved:', {
      schoolsCount: schools?.length || 0,
      studentsCount: students?.length || 0,
      scoresCount: scores?.length || 0,
      placementResultsCount: placementResults?.length || 0,
      incremental: !!lastSyncTime
    })

    const responseTime = new Date().toISOString()
    res.json({
      success: true,
      data: {
        schools: schools || [],
        students: students || [],
        scores: scores || [],
        placementResults: placementResults || [],
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
