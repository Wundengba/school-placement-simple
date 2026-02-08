import express from 'express'
import {
  getPlacements,
  getPlacementById,
  runPlacementAlgorithm,
  getPlacementStats
} from '../controllers/placementController.js'

const router = express.Router()

router.get('/', getPlacements)
router.get('/:id', getPlacementById)
router.post('/run-algorithm', runPlacementAlgorithm)
router.get('/stats', getPlacementStats)

export default router
