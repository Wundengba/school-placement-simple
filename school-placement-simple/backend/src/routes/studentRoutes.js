import express from 'express'
import {
  loginStudent,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  updatePreferences,
  deleteStudent
} from '../controllers/studentController.js'

const router = express.Router()

router.post('/login', loginStudent)
router.get('/', getStudents)
router.get('/:id', getStudentById)
router.post('/', createStudent)
router.put('/:id', updateStudent)
router.post('/:id/preferences', updatePreferences)
router.delete('/:id', deleteStudent)

export default router
