import express from 'express'
import Student from '../models/Student.js'
import School from '../models/School.js'
import TestScore from '../models/TestScore.js'

const router = express.Router()

// Upload data to database (upsert)
router.post('/upload', async (req, res) => {
  try {
    const { schools, students, scores, preferences } = req.body
    console.log('[SYNC-UPLOAD] Starting upload with:', {
      schoolsCount: schools?.length || 0,
      studentsCount: students?.length || 0,
      scoresCount: scores?.length || 0
    })

    // Use Promise.all for parallel batch operations
    const operations = []

    // Batch upsert schools
    if (schools && Array.isArray(schools) && schools.length > 0) {
      const schoolOps = schools.map(school =>
        School.updateOne(
          { externalId: school.externalId },
          { $set: school },
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
          { $set: student },
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
          { $set: score },
          { upsert: true }
        ).catch(err => {
          console.error('[SYNC-UPLOAD] Score upsert error:', err.message)
          return { error: err.message, type: 'score' }
        })
      )
      operations.push(...scoreOps)
    }

    // Execute all operations in parallel
    if (operations.length > 0) {
      console.log('[SYNC-UPLOAD] Executing', operations.length, 'parallel operations...')
      await Promise.all(operations)
      console.log('[SYNC-UPLOAD] All operations completed')
    }

    res.json({
      success: true,
      message: 'Data synced successfully',
      synced: {
        schools: schools?.length || 0,
        students: students?.length || 0,
        scores: scores?.length || 0
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
    console.log('[SYNC-DOWNLOAD] Starting download of all collections...')
    
    // Execute queries in parallel with timeout handling
    const [schools, students, scores] = await Promise.all([
      School.find().lean().exec(),
      Student.find().lean().exec(),
      TestScore.find().lean().exec()
    ]).then(results => results)
      .catch(error => {
        // Handle timeout error
        if (error.message.includes('buffering timed out')) {
          console.warn('[SYNC-DOWNLOAD] Database query timeout, returning empty datasets')
          return [[], [], []]
        }
        throw error
      })

    console.log('[SYNC-DOWNLOAD] Retrieved:', {
      schoolsCount: schools?.length || 0,
      studentsCount: students?.length || 0,
      scoresCount: scores?.length || 0
    })

    res.json({
      success: true,
      data: {
        schools: schools || [],
        students: students || [],
        scores: scores || [],
        timestamp: new Date()
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
