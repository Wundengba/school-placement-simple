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
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', loginStudent)
router.get('/', getStudents)
router.get('/:id', getStudentById)
router.post('/', createStudent)
router.put('/:id', updateStudent)
router.post('/:id/preferences', updatePreferences)
router.delete('/:id', deleteStudent)

// Mock scores route (protected)
router.get('/:id/mocks', verifyToken, getStudentMockScores)

export default router