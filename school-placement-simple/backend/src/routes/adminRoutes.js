import express from 'express'
import {
  loginAdmin,
  registerAdmin,
  getAdminProfile,
  updateAdminProfile,
  listAdmins,
  deactivateAdmin,
  createMock,
  listMocks,
  getMockDetails,
  updateMock,
  deleteMock,
  assignMockScores,
  updateMockScore
} from '../controllers/adminController.js'
import { verifyAdminToken } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/login', loginAdmin)

// Protected routes (require admin token)
router.post('/register', verifyAdminToken, registerAdmin)
router.get('/profile', verifyAdminToken, getAdminProfile)
router.put('/profile', verifyAdminToken, updateAdminProfile)
router.get('/list', verifyAdminToken, listAdmins)
router.post('/:adminId/deactivate', verifyAdminToken, deactivateAdmin)

// Mock exam routes
router.post('/mocks/create', verifyAdminToken, createMock)
router.get('/mocks/list', verifyAdminToken, listMocks)
router.get('/mocks/:mockId', verifyAdminToken, getMockDetails)
router.put('/mocks/:mockId', verifyAdminToken, updateMock)
router.delete('/mocks/:mockId', verifyAdminToken, deleteMock)
router.post('/mocks/:mockId/scores', verifyAdminToken, assignMockScores)
router.put('/mocks/:mockId/scores/:scoreId', verifyAdminToken, updateMockScore)

export default router
