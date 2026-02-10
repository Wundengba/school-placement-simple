import express from 'express'
import Student from '../models/Student.js'
import School from '../models/School.js'
import TestScore from '../models/TestScore.js'
import Placement from '../models/Placement.js'
import Tombstone from '../models/Tombstone.js'
import mongoose from 'mongoose'

const router = express.Router()

// Upload data to database (upsert)
router.post('/upload', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
    
    const { schools, students, scores, preferences, placementResults, analytics, deletedStudents, deletedScores, deletedSchools } = req.body
    console.log('[SYNC-UPLOAD] DB State:', dbStates[dbState] || 'unknown', '(', dbState, ')')
    console.log('[SYNC-UPLOAD] Starting upload with:', {
      schoolsCount: schools?.length || 0,
      studentsCount: students?.length || 0,
      scoresCount: scores?.length || 0,
      preferencesCount: preferences?.length || 0,
      placementResultsCount: placementResults?.length || 0,
      hasAnalytics: !!analytics
    })

    // Load existing tombstones so we can avoid upserting tombstoned items
    const existingTombstones = await Tombstone.find({}).lean().exec()
    const existingDeletedStudents = new Set(existingTombstones.filter(t => t.type === 'student').map(t => String(t.key).trim().toUpperCase()))
    const existingDeletedScores = new Set(existingTombstones.filter(t => t.type === 'score').map(t => String(t.key).trim().toUpperCase()))
    const existingDeletedSchools = new Set(existingTombstones.filter(t => t.type === 'school').map(t => String(t.key).trim()))

    const normalize = (v) => String(v || '').trim()

    // Apply deletions: create tombstones (persistent) and attempt best-effort deletion
    if (Array.isArray(deletedStudents) && deletedStudents.length > 0) {
      try {
        const normalize = (v) => String(v || '').trim()
        const ops = deletedStudents.map(s => ({
          updateOne: {
            filter: { type: 'student', key: normalize(s) },
            update: { $setOnInsert: { type: 'student', key: normalize(s), createdAt: new Date() } },
            upsert: true
          }
        }))
        if (ops.length > 0) await Tombstone.bulkWrite(ops)
        // Best-effort mark actual student documents as deleted (soft-delete)
        await Student.updateMany({ indexNumber: { $in: deletedStudents.map(normalize) } }, { $set: { deleted: true, updatedAt: new Date() } })
        console.log('[SYNC-UPLOAD] Tombstones created for deleted students:', deletedStudents.length)
      } catch (err) {
        console.error('[SYNC-UPLOAD] Error creating student tombstones:', err.message)
      }
    }

    if (Array.isArray(deletedScores) && deletedScores.length > 0) {
      try {
        const normalize = (v) => String(v || '').trim()
        const ops = deletedScores.map(s => ({
          updateOne: {
            filter: { type: 'score', key: normalize(s) },
            update: { $setOnInsert: { type: 'score', key: normalize(s), createdAt: new Date() } },
            upsert: true
          }
        }))
        if (ops.length > 0) await Tombstone.bulkWrite(ops)
        await TestScore.updateMany({ indexNumber: { $in: deletedScores.map(normalize) } }, { $set: { deleted: true, updatedAt: new Date() } })
        console.log('[SYNC-UPLOAD] Tombstones created for deleted scores:', deletedScores.length)
      } catch (err) {
        console.error('[SYNC-UPLOAD] Error creating score tombstones:', err.message)
      }
    }

    if (Array.isArray(deletedSchools) && deletedSchools.length > 0) {
      try {
        const normalize = (v) => String(v || '').trim()
        const ops = deletedSchools.map(s => ({
          updateOne: {
            filter: { type: 'school', key: normalize(s) },
            update: { $setOnInsert: { type: 'school', key: normalize(s), createdAt: new Date() } },
            upsert: true
          }
        }))
        if (ops.length > 0) await Tombstone.bulkWrite(ops)
        await School.updateMany({ id: { $in: deletedSchools.map(normalize) } }, { $set: { deleted: true, updatedAt: new Date() } })
        console.log('[SYNC-UPLOAD] Tombstones created for deleted schools:', deletedSchools.length)
      } catch (err) {
        console.error('[SYNC-UPLOAD] Error creating school tombstones:', err.message)
      }
    }

    // Batch upsert schools using bulkWrite (faster, batched)
    if (schools && Array.isArray(schools) && schools.length > 0) {
      const allDeletedSchoolKeys = new Set([...existingDeletedSchools, ...(deletedSchools || []).map(s => normalize(s))])
      const schoolsToUpsert = schools.filter(school => {
        const key = normalize(school.id || school.externalId)
        return key && !allDeletedSchoolKeys.has(key)
      })
      if (schoolsToUpsert.length > 0) {
        try {
          const schoolBatch = schoolsToUpsert.map(school => ({
            updateOne: {
              filter: { externalId: school.externalId },
              update: { $set: { ...school, updatedAt: new Date() } },
              upsert: true
            }
          }))
          // Batch in chunks of 100 to avoid overwhelming the DB
          for (let i = 0; i < schoolBatch.length; i += 100) {
            await School.bulkWrite(schoolBatch.slice(i, i + 100))
          }
          console.log('[SYNC-UPLOAD] Upserted schools:', schoolsToUpsert.length)
        } catch (err) {
          console.error('[SYNC-UPLOAD] School batch upsert error:', err.message)
        }
      }
    }

    // Batch upsert students using bulkWrite
    if (students && Array.isArray(students) && students.length > 0) {
      const allDeletedStudentKeys = new Set([...existingDeletedStudents, ...(deletedStudents || []).map(s => normalize(s).toUpperCase())])
      const studentsToUpsert = students.filter(student => {
        const key = normalize(student.indexNumber).toUpperCase()
        return key && !allDeletedStudentKeys.has(key)
      })
      if (studentsToUpsert.length > 0) {
        try {
          const studentBatch = studentsToUpsert.map(student => ({
            updateOne: {
              filter: { indexNumber: student.indexNumber },
              update: { $set: { ...student, updatedAt: new Date() } },
              upsert: true
            }
          }))
          // Batch in chunks of 100
          for (let i = 0; i < studentBatch.length; i += 100) {
            await Student.bulkWrite(studentBatch.slice(i, i + 100))
          }
          console.log('[SYNC-UPLOAD] Upserted students:', studentsToUpsert.length)
        } catch (err) {
          console.error('[SYNC-UPLOAD] Student batch upsert error:', err.message)
        }
      }
    }

    // Batch upsert test scores using bulkWrite
    if (scores && Array.isArray(scores) && scores.length > 0) {
      const allDeletedScoreKeys = new Set([...existingDeletedScores, ...(deletedScores || []).map(s => normalize(s).toUpperCase())])
      const scoresToUpsert = scores.filter(score => {
        const key = normalize(score.indexNumber).toUpperCase()
        return key && !allDeletedScoreKeys.has(key)
      })
      if (scoresToUpsert.length > 0) {
        try {
          const scoreBatch = scoresToUpsert.map(score => ({
            updateOne: {
              filter: { indexNumber: score.indexNumber },
              update: { $set: { ...score, updatedAt: new Date() } },
              upsert: true
            }
          }))
          // Batch in chunks of 100
          for (let i = 0; i < scoreBatch.length; i += 100) {
            await TestScore.bulkWrite(scoreBatch.slice(i, i + 100))
          }
          console.log('[SYNC-UPLOAD] Upserted scores:', scoresToUpsert.length)
        } catch (err) {
          console.error('[SYNC-UPLOAD] Score batch upsert error:', err.message)
        }
      }
    }

    // Batch upsert placement results using bulkWrite
    if (placementResults && Array.isArray(placementResults) && placementResults.length > 0) {
      try {
        const placementBatch = placementResults.map(result => ({
          updateOne: {
            filter: { indexNumber: result.indexNumber },
            update: { $set: { ...result, updatedAt: new Date() } },
            upsert: true
          }
        }))
        // Batch in chunks of 100
        for (let i = 0; i < placementBatch.length; i += 100) {
          await Placement.bulkWrite(placementBatch.slice(i, i + 100))
        }
        console.log('[SYNC-UPLOAD] Upserted placements:', placementResults.length)
      } catch (err) {
        console.error('[SYNC-UPLOAD] Placement batch upsert error:', err.message)
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

    // Exclude soft-deleted documents
    studentQuery.deleted = { $ne: true }
    scoreQuery.deleted = { $ne: true }
    schoolQuery.deleted = { $ne: true }
    
    // Execute queries in parallel with timeout handling
    // Exclude any records that have tombstones
    const tombstones = await Tombstone.find({}).lean().exec()
    const deletedStudentKeys = new Set(tombstones.filter(t => t.type === 'student').map(t => String(t.key).trim().toUpperCase()))
    const deletedScoreKeys = new Set(tombstones.filter(t => t.type === 'score').map(t => String(t.key).trim().toUpperCase()))
    const deletedSchoolKeys = new Set(tombstones.filter(t => t.type === 'school').map(t => String(t.key).trim()))

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

    // Filter out tombstoned items from results
    const filteredSchools = (schools || []).filter(s => !deletedSchoolKeys.has(String(s.id || s.externalId || '').trim()))
    const filteredStudents = (students || []).filter(s => !deletedStudentKeys.has(String(s.indexNumber || '').trim().toUpperCase()))
    const filteredScores = (scores || []).filter(s => !deletedScoreKeys.has(String(s.indexNumber || '').trim().toUpperCase()))

    console.log('[SYNC-DOWNLOAD] Retrieved (before filtering):', {
      schoolsCount: schools?.length || 0,
      studentsCount: students?.length || 0,
      scoresCount: scores?.length || 0,
      placementResultsCount: placementResults?.length || 0,
      incremental: !!lastSyncTime
    })
    console.log('[SYNC-DOWNLOAD] Tombstones:', {
      deletedSchools: deletedSchoolKeys.size,
      deletedStudents: deletedStudentKeys.size,
      deletedScores: deletedScoreKeys.size
    })

    const responseTime = new Date().toISOString()
    res.json({
      success: true,
      data: {
        schools: filteredSchools || [],
        students: filteredStudents || [],
        scores: filteredScores || [],
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

// Debug: list tombstones
router.get('/tombstones', async (req, res) => {
  try {
    const all = await Tombstone.find({}).lean().exec()
    res.json({ success: true, count: all.length, data: all })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
