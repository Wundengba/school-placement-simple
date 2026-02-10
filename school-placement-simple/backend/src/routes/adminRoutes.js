import express from 'express'
import { 
  loginAdmin, 
  registerAdmin, 
  getAdminProfile, 
  updateAdminProfile,
  listAdmins,
  deactivateAdmin
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

export default router
