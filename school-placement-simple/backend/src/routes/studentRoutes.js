import express from 'express'
import {
  loginStudent,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  updatePreferences,
  deleteStudent,
  getStudentMockScores
} from '../controllers/studentController.js'
import { verifyAdminToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', loginStudent)
router.get('/', getStudents)
router.get('/:id', getStudentById)
router.post('/', createStudent)
router.put('/:id', updateStudent)
router.post('/:id/preferences', updatePreferences)
router.delete('/:id', deleteStudent)

// Mock scores route (no auth needed for now)
router.get('/:id/mocks', getStudentMockScores)

export default router