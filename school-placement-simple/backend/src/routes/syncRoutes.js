import express from 'express'
import Student from '../models/Student.js'
import School from '../models/School.js'
import TestScore from '../models/TestScore.js'

const router = express.Router()

// Upload data to database (upsert)
router.post('/upload', async (req, res) => {
  try {
    const { schools, students, scores, preferences } = req.body
    const timeoutMs = 30000

    // Upsert schools
    if (schools && Array.isArray(schools)) {
      for (const school of schools) {
        await School.updateOne(
          { externalId: school.externalId },
          { $set: school },
          { upsert: true, maxTimeMS: timeoutMs }
        )
      }
    }

    // Upsert students
    if (students && Array.isArray(students)) {
      for (const student of students) {
        await Student.updateOne(
          { indexNumber: student.indexNumber },
          { $set: student },
          { upsert: true, maxTimeMS: timeoutMs }
        )
      }
    }

    // Upsert test scores
    if (scores && Array.isArray(scores)) {
      for (const score of scores) {
        await TestScore.updateOne(
          { indexNumber: score.indexNumber },
          { $set: score },
          { upsert: true, maxTimeMS: timeoutMs }
        )
      }
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
    console.error('Sync upload error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Download database snapshot
router.get('/download', async (req, res) => {
  try {
    // Use maxTimeMS to set a longer timeout for the operation
    const options = { maxTimeMS: 30000 }
    
    const [schools, students, scores] = await Promise.all([
      School.find().lean().maxTimeMS(30000),
      Student.find().lean().maxTimeMS(30000),
      TestScore.find().lean().maxTimeMS(30000)
    ])

    res.json({
      success: true,
      data: {
        schools,
        students,
        scores,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Sync download error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
